from app.database import Base
from sqlalchemy import Column, Integer, DateTime, Float, String, Boolean
from sqlalchemy.orm import Session

class Model(Base):
    __tablename__ = "model"
    version = Column(Integer, primary_key=True, autoincrement=True)
    finish_train_date = Column(DateTime(timezone=True), nullable=True)
    test_map = Column(Float, nullable=True)
    test_mae = Column(Float, nullable=True)
    model_url = Column(String, nullable=True)
    run_id = Column(String, nullable=True)
    deployed = Column(Boolean, default=False)

    @classmethod
    def create(cls, db: Session, **kw):
        new = cls(**kw)
        db.add(new)
        db.commit()
        return new
    
    @classmethod
    def retrieve(cls, db:Session, version: int):
        return db.query(cls).filter(cls.version == version).one_or_none()
    
    @classmethod
    def get_deployed_model(cls, db:Session):
        return db.query(cls).filter(cls.deployed == True).one_or_none()

    @classmethod
    def search(cls, db: Session):
        return db.query(cls).all()
    
    def update_self(self, db: Session, **kw):
        for key, value in kw.items():
            setattr(self, key, value)
        db.commit()
        return self
    
    @classmethod
    def update(cls, db: Session, version:int, **kw):
        model = db.query(cls).filter(cls.version == version).one_or_none()
        if model:
            for key, value in kw.items():
                setattr(model, key, value)
            db.commit()
        return model
    
    @classmethod
    def count(cls, db: Session):
        return db.query(cls).count()