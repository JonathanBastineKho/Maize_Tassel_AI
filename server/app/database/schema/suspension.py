from sqlalchemy import DateTime, Column, String, ForeignKey
from sqlalchemy.orm import relationship, Session
from datetime import datetime
from app.database import Base

class Suspension(Base):
    __tablename__ = "suspensions"
    user_email = Column(String, ForeignKey('users.email'), primary_key=True)
    start_date = Column(DateTime(timezone=True), primary_key=True)
    end_date = Column(DateTime(timezone=True))
    reason = Column(String)
    user = relationship('User', backref='suspensions')

    @classmethod
    def create(cls, db: Session, **kw):
        new = cls(**kw)
        db.add(new)
        db.commit()
        return new

    @classmethod
    def retrieve(cls, db: Session, email: str, date: datetime):
        return db.query(cls).filter(
            cls.user_email == email,
            cls.start_date <= date,
            cls.end_date >= date
        ).all()