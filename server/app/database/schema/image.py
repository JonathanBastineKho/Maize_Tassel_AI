from datetime import timezone
from sqlalchemy import func, DateTime, Column, String, Boolean, Integer, Enum, UniqueConstraint, ForeignKey
from sqlalchemy.orm import relationship, Session
from fastapi import HTTPException
from typing import Optional
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
    folder = relationship('Folder', backref='images')
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
    def search(cls, db: Session, folder_id: str, offset:int, page_size:int = 20, search: Optional[str] = None):
        img_query = db.query(cls).filter(cls.folder_id == folder_id)
        if search:
            img_query = img_query.filter(cls.name.ilike(f"%{search}%"))

        return img_query.offset(offset).limit(page_size).all()
    
    @classmethod
    def delete(cls, db: Session, name: str, folder_id: str):
        img = cls.retrieve(db, name=name, folder_id=folder_id)
        image_url = img.image_url
        db.delete(img)
        db.commit()
        return image_url
    
    @classmethod
    def update(cls, db: Session, name: str, folder_id: str, **kwargs):
        img = cls.retrieve(db, name=name, folder_id=folder_id)
        for key, value in kwargs.items():
            setattr(img, key, value)
        db.commit()
        return img
    
    @classmethod
    def count(cls, db: Session, email: str):
        fldr_list = Folder.search(db, user_email=email, offset=0, page_size=None)
        return sum([db.query(cls).filter(cls.folder_id == fldr.id).count() for fldr in fldr_list])