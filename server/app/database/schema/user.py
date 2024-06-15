from fastapi import HTTPException
from typing import Optional
from sqlalchemy import Column, String, Boolean, Enum
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import Base
from .enum import TypeOfUser

class User(Base):
    __tablename__ = "users"
    email = Column(String, primary_key=True)
    name = Column(String)
    password = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    country = Column(String, nullable=True)
    profile_pict = Column(String, default="https://storage.googleapis.com/corn_sight_public/default_profile.jpg")
    verified = Column(Boolean, default=False)
    role = Column(Enum(TypeOfUser.ADMIN, TypeOfUser.REGULAR, TypeOfUser.PREMIUM), default=TypeOfUser.REGULAR)

    @classmethod
    def create(cls, db: Session, **kw):
        new = cls(**kw)
        db.add(new)
        db.commit()
        return new

    @classmethod
    def retrieve(cls, db: Session, email: str):
        return db.query(cls).filter(cls.email == email).one_or_none()
    
    @classmethod
    def search(cls, db: Session, offset:int, page_size:int = 20, search: Optional[str] = None,
               country: Optional[str] = None, google_account: Optional[bool] = None, 
               premium_account: Optional[bool] = None):
        user_query = db.query(cls).filter(cls.role != TypeOfUser.ADMIN)
        if search:
            user_query = user_query.filter(or_(
                cls.name.ilike(f"%{search}%"),
                cls.email.ilike(f"%{search}%")
            ))
        if country:
            user_query = user_query.filter(cls.country.ilike(f"%{country}%"))
        if google_account is not None:
            if google_account:
                user_query = user_query.filter(cls.password == None)
            else:
                user_query = user_query.filter(cls.password != None)
        if premium_account is not None:
            if premium_account:
                user_query = user_query.filter(cls.role == TypeOfUser.PREMIUM)
            else:
                user_query = user_query.filter(cls.role != TypeOfUser.PREMIUM)
        return user_query.offset(offset).limit(page_size).all()
    
    @classmethod
    def update(cls, db: Session, email: str, **kwargs):
        db_user = cls.retrieve(db, email)
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")

        if kwargs.pop('verified', False):
            if db_user.verified:
                raise HTTPException(status_code=409, detail="User already verified")
            db_user.verified = True

        if kwargs.pop('password', None) and db_user.password is None:
            raise HTTPException(status_code=400, detail="Cannot update password for a Google account")

        for key, value in kwargs.items():
            setattr(db_user, key, value)
        db.commit()
        return db_user