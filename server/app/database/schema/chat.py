from sqlalchemy import DateTime, Column, String, ForeignKey, Integer, func, DATE
from sqlalchemy.orm import relationship, Session
from datetime import date
from app.database import Base

class Chat(Base):
    __tablename__ = "chat"
    user_email = Column(String, ForeignKey('users.email'), primary_key=True)
    date = Column(DATE, primary_key=True, server_default=func.date('now'))
    count = Column(Integer, default=0)
    user = relationship('User', backref='chat')

    @classmethod
    def create(cls, db: Session, **kw):
        new = cls(**kw)
        db.add(new)
        db.commit()
        return new
    
    @classmethod
    def retrieve(cls, db: Session, user_email: str):
        today = date.today()
        return db.query(cls).filter(
            cls.user_email == user_email,
            cls.date == today
        ).one_or_none()


    @classmethod
    def add(cls, db: Session, user_email: str):
        today = date.today()
        chat = cls.retrieve(db, user_email)
        if chat:
            chat.count += 1
        else:
            chat = cls(user_email=user_email, date=today, count=1)
            db.add(chat)
        db.commit()
        return chat