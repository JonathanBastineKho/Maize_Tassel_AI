import uuid
from datetime import timezone
from typing import Optional
from fastapi import HTTPException
from sqlalchemy import func, DateTime, Column, String, UniqueConstraint, ForeignKey
from sqlalchemy.orm import Session
from sqlalchemy.orm import relationship
from app.database import Base

class Folder(Base):
    __tablename__ = "folders"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4())) # Change to UUID data type during production
    name = Column(String)
    parent_id = Column(String(36), ForeignKey('folders.id'), nullable=True) # Change to UUID data type during production
    user_email = Column(String, ForeignKey('users.email'), nullable=False)
    create_date = Column(DateTime(timezone=True), server_default=func.now(timezone=timezone.utc))
    parent = relationship('Folder', remote_side=[id], backref='children')
    user = relationship('User', backref='folders')

    __table_args__ = (
        UniqueConstraint('name', 'parent_id', 'user_email'),
    )

    @classmethod
    def create(cls, db: Session, **kw):
        new = cls(**kw)
        db.add(new)
        db.commit()
        return new
    
    @classmethod
    def retrieve_root(cls, db: Session, user_email: str):
        return db.query(cls).filter(cls.user_email == user_email, cls.parent_id == None).one_or_none()
    
    @classmethod
    def retrieve(cls, db: Session, folder_id: str):
        folder = db.query(cls).filter(cls.id == folder_id).one_or_none()
        if not folder:
            raise HTTPException(400, "folder does not exist")
        return folder
    
    @classmethod
    def search(cls, db: Session, folder_id: str, user_email:str, offset:int, page_size:int = 20, search: Optional[str] = None):
        fldr_query = db.query(cls).filter(
            cls.parent_id == folder_id,
            cls.user_email == user_email
        )
        if search:
            fldr_query = fldr_query.filter(cls.name.ilike(f"%{search}%"))
        
        return fldr_query.offset(offset).limit(page_size).all()
    
    @classmethod
    def count(cls, db: Session, folder_id: str, user_email: str, search: Optional[str] = None):
        fldr_query = db.query(cls).filter(
            cls.parent_id == folder_id,
            cls.user_email == user_email
        )
        if search:
            fldr_query = fldr_query.filter(cls.name.ilike(f"%{search}%"))
        return fldr_query.count()