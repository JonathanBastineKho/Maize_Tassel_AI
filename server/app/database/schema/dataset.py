from app.database import Base
from fastapi import HTTPException
from datetime import timezone
from typing import Optional
from sqlalchemy import Column, String, DateTime, func
from sqlalchemy.orm import relationship, Session

class Dataset(Base):
    __tablename__ = "dataset"
    name = Column(String, primary_key=True)
    create_date = Column(DateTime(timezone=True), server_default=func.now(timezone=timezone.utc))

    @classmethod
    def create(cls, db: Session, **kw):
        new = cls(**kw)
        db.add(new)
        db.commit()
        return new
    
    @classmethod
    def search_images(cls, db: Session, dataset_name):
        dataset = db.query(cls).filter(cls.name == dataset_name).one_or_none()
        if dataset:
            return dataset.images
        else:
            raise HTTPException(400, detail="Dataset name invalid")
    
    @classmethod
    def search(cls, db: Session, dataset_name: Optional[str] = None, offset:int = 0, page_size:int = 20):
        query = db.query(cls)
        
        if dataset_name is not None:
            query = query.filter(cls.name.ilike(f"%{dataset_name}%"))
        
        query = query.offset(offset).limit(page_size)
        
        return query.all()