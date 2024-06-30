from app.database import Base
from sqlalchemy import Column, Integer, DateTime, Float, String

class Model(Base):
    __tablename__ = "model"
    version = Column(Integer, primary_key=True)
    finish_train_date = Column(DateTime(timezone=True), nullable=True)
    test_map = Column(Float, nullable=True)
    test_mae = Column(Float, nullable=True)
    model_url = Column(String, nullable=True)