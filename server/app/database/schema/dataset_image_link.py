from typing import Optional
from datetime import datetime, timedelta
from fastapi import HTTPException
from app.database import Base
from app.database.schema import Image, Label as SchemaLabel
from sqlalchemy import Column, String, ForeignKey, UniqueConstraint, ForeignKeyConstraint, func, and_, or_
from sqlalchemy.orm import relationship, Session, backref, aliased

class DatasetImageLink(Base):
    __tablename__ = "dataset_image_link"
    
    dataset_name = Column(String, ForeignKey('dataset.name'), primary_key=True)
    image_name = Column(String, primary_key=True)
    image_folder_id = Column(String(36), primary_key=True)
    image_url = Column(String)
    thumbnail_url = Column(String)

    dataset = relationship("Dataset", backref=backref("images", cascade="all, delete-orphan"))
    image = relationship("Image", 
                         backref=backref("datasets", cascade="all, delete-orphan"),
                         foreign_keys=[image_name, image_folder_id],
                         primaryjoin="and_(DatasetImageLink.image_name==Image.name, "
                                     "DatasetImageLink.image_folder_id==Image.folder_id)")

    __table_args__ = (
        UniqueConstraint('dataset_name', 'image_name', 'image_folder_id', name='uix_dataset_image'),
        ForeignKeyConstraint(['image_name', 'image_folder_id'], ['images.name', 'images.folder_id'],
                             onupdate="CASCADE"),
    )

    @classmethod
    def create(cls, db: Session, **kw):
        new = cls(**kw)
        db.add(new)
        db.commit()
        return new
    
    def delete(self, db: Session):
        db.delete(self)
        db.commit()
    
    @classmethod
    def retrieve(cls, db: Session, dataset_name: str, image_name: str, folder_id: str):
        result = db.query(cls, Image.feedback, Image.upload_date).\
            join(Image, and_(cls.image_name == Image.name, cls.image_folder_id == Image.folder_id)).\
            filter(cls.dataset_name == dataset_name, 
                   cls.image_name == image_name, 
                   cls.image_folder_id == folder_id).\
            one_or_none()

        if not result:
            raise HTTPException(status_code=400, detail="Image not found in the dataset")
        return result
    
    @classmethod
    def search_images(cls, db: Session, dataset_name: str, offset:int = 0, page_size:int = 20, search: Optional[str] = None,
               start_date: Optional[datetime] = None, end_date: Optional[datetime] = None,
               min_tassel_count: Optional[int] = None, max_tassel_count: Optional[int] = None):
        LabelAlias = aliased(SchemaLabel)  # Create an alias for the Label class
        query = db.query(Image, cls.image_url, cls.thumbnail_url, func.count(LabelAlias.box_id).label('label_count')).\
            join(cls, and_(cls.image_name == Image.name, cls.image_folder_id == Image.folder_id)).\
            outerjoin(LabelAlias, and_(LabelAlias.image_name == Image.name, 
                                       LabelAlias.image_folder_id == Image.folder_id,
                                       LabelAlias.dataset_name == cls.dataset_name)).\
            filter(cls.dataset_name == dataset_name)
        
        # Apply filters
        if search:
            query = query.filter(or_(Image.name.ilike(f"%{search}%"), Image.description.ilike(f"%{search}%")))
        if start_date:
            query = query.filter(Image.upload_date >= start_date)
        if end_date:
            query = query.filter(Image.upload_date < end_date + timedelta(days=1))

        # Group by to get label count
        query = query.group_by(Image.name, Image.folder_id, cls.image_url, cls.thumbnail_url)
        
        # Apply tassel count filters (now based on the counted labels)
        if min_tassel_count is not None:
            query = query.having(func.count(LabelAlias.box_id) >= min_tassel_count)
        if max_tassel_count is not None:
            query = query.having(func.count(LabelAlias.box_id) <= max_tassel_count)
        
        # Apply pagination
        query = query.offset(offset).limit(page_size)

        return query.all()