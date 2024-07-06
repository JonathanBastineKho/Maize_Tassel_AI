from app.database import Base
from fastapi import HTTPException
from datetime import timezone
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