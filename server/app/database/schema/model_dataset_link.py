from app.database import Base
from sqlalchemy import Column, Integer, String, ForeignKey

class ModelDatasetLink(Base):
    __tablename__ = "model_dataset_link"
    version = Column(Integer, ForeignKey('model.version'), primary_key=True)
    dataset_name = Column(String, ForeignKey('dataset.name'), primary_key=True)
    
    