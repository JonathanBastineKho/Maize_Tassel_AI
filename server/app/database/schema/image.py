from datetime import timezone, datetime, timedelta
from sqlalchemy import func, DateTime, Column, String, Boolean, Integer, Enum, UniqueConstraint, ForeignKey, cast, Date
from sqlalchemy.orm import relationship, Session, backref
from fastapi import HTTPException
from typing import Optional, List
from app.database import Base
from app.database.schema import Folder
from .enum import TypeOfImageStatus

class Image(Base):
    __tablename__ = "images"
    name = Column(String, primary_key=True)
    description = Column(String)
    folder_id = Column(String(36), ForeignKey('folders.id'), primary_key=True)  # Change to UUID data type during production
    size = Column(Integer)
    width = Column(Integer)
    height = Column(Integer)
    image_url = Column(String)
    thumbnail_url = Column(String)
    feedback = Column(Boolean, nullable=True)
    processing_status = Column(Enum(TypeOfImageStatus.IN_QUEUE, TypeOfImageStatus.PROCESSING, TypeOfImageStatus.DONE, TypeOfImageStatus.ERROR), default=TypeOfImageStatus.IN_QUEUE)
    upload_date = Column(DateTime(timezone=True), server_default=func.now(timezone=timezone.utc))
    finish_date = Column(DateTime(timezone=True))
    tassel_count = Column(Integer, nullable=True)
    folder = relationship('Folder', backref=backref('images', cascade='all, delete-orphan'))
    __table_args__ = (
        UniqueConstraint('name', 'folder_id'),
    )

    @classmethod
    def create(cls, db: Session, **kw):
        new = cls(**kw)
        db.add(new)
        db.commit()
        return new
    
    @classmethod
    def retrieve(cls, db: Session, name: str, folder_id: str):
        img = db.query(cls).filter(cls.name == name, cls.folder_id == folder_id).one_or_none()
        if not img:
            raise HTTPException(400, detail="Invalid image")
        return img
    
    @classmethod
    def search(cls, db: Session, folder_id: str, offset:int, page_size:int = 20, search: Optional[str] = None,
               start_date: Optional[datetime] = None, end_date: Optional[datetime] = None,
               min_tassel_count: Optional[int] = None, max_tassel_count: Optional[int] = None):
        img_query = db.query(cls).filter(cls.folder_id == folder_id)
        if search:
            img_query = img_query.filter(cls.name.ilike(f"%{search}%"))
        if start_date:
            img_query = img_query.filter(cls.upload_date >= start_date)
        if end_date:
            img_query = img_query.filter(cls.upload_date < end_date + timedelta(days=1))
        if min_tassel_count is not None:
            img_query = img_query.filter(cls.tassel_count >= min_tassel_count)
        if max_tassel_count is not None:
            img_query = img_query.filter(cls.tassel_count <= max_tassel_count)
            
        if offset is not None:
            img_query.offset(offset)
        if page_size is not None:
            img_query.limit(page_size)
            
        return img_query.all()
    
    @classmethod
    def delete(cls, db: Session, name: str, folder_id: str):
        img = cls.retrieve(db, name=name, folder_id=folder_id)
        image_url = img.image_url
        db.delete(img)
        db.commit()
        return image_url
    
    @classmethod
    def update(cls, db: Session, old_name: str, folder_id: str, **kwargs):
        img = cls.retrieve(db, name=old_name, folder_id=folder_id)
        for key, value in kwargs.items():
            setattr(img, key, value)
        db.commit()
        return img
    
    @classmethod
    def count(cls, db: Session, email: str):
        fldr_list = Folder.search(db, user_email=email, offset=0, page_size=None)
        return sum([db.query(cls).filter(cls.folder_id == fldr.id).count() for fldr in fldr_list])
    
    @classmethod
    def get_tassel_count_by_date(cls, db: Session, folder_ids: List[str], start_date: Optional[datetime] = None, end_date: Optional[datetime] = None):
        query = db.query(
            func.date(cls.upload_date).label('date'),
            func.sum(cls.tassel_count).label('total_tassel_count')
        ).filter(cls.folder_id.in_(folder_ids))

        if start_date:
            query = query.filter(cls.upload_date >= start_date)
        if end_date:
            query = query.filter(cls.upload_date < end_date + timedelta(days=1))

        tassel_counts = query.group_by(func.date(cls.upload_date)).all()
        return tassel_counts
