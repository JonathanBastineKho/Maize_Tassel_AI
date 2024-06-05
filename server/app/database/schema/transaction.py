from sqlalchemy import DateTime, Column, String, Boolean, Float, ForeignKey
from sqlalchemy.orm import relationship, Session
from app.database import Base

class Transaction(Base):
    __tablename__ = "transactions"
    transaction_id = Column(String, unique=True, nullable=False)
    user_email = Column(String, ForeignKey('users.email'), primary_key=True)
    start_date = Column(DateTime(timezone=True), primary_key=True)
    end_date = Column(DateTime(timezone=True))
    amount = Column(Float, nullable=False)
    currency = Column(String, nullable=False)
    auto_renew = Column(Boolean, nullable=False, default=True)
    success = Column(Boolean, nullable=False, default=True)

    user = relationship('User', backref='transactions')

    @classmethod
    def create(cls, db: Session, **kw):
        new = cls(**kw)
        db.add(new)
        db.commit()
        return new
    
    @classmethod
    def retrieve(cls, db: Session, user_email: str):
        return db.query(cls).filter(cls.user_email == user_email).order_by(cls.start_date.desc()).all()
    
    @classmethod
    def retrieve_latest(cls, db: Session, user_email: str):
        return db.query(cls).filter(cls.user_email == user_email).order_by(cls.start_date.desc()).first()
    
    @classmethod
    def update(cls, db: Session, trx: 'Transaction', auto_renew: bool):
        trx.auto_renew = auto_renew
        db.commit()
        return trx
    
    @classmethod
    def search(cls, db: Session):
        return db.query(cls).order_by(cls.start_date.desc()).all()
