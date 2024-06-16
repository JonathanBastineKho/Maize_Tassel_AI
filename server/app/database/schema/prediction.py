from sqlalchemy import Column, String, Integer, Float, ForeignKeyConstraint
from sqlalchemy.orm import relationship, backref, Session
from app.database import Base

class Prediction(Base):
    __tablename__ = "predictions"
    folder_id = Column(String(36), primary_key=True)  # Change to UUID data type during production
    image_name = Column(String, primary_key=True)
    box_id = Column(Integer, primary_key=True)
    xCenter = Column(Integer)
    yCenter = Column(Integer)
    width = Column(Integer)
    height = Column(Integer)
    confidence = Column(Float)
    image = relationship('Image', backref=backref('predictions', cascade='all, delete-orphan'), 
                         primaryjoin='and_(Prediction.folder_id == Image.folder_id, Prediction.image_name == Image.name)')

    __table_args__ = (
        ForeignKeyConstraint(['folder_id', 'image_name'], ['images.folder_id', 'images.name']),
    )

    @classmethod
    def create(cls, db: Session, **kw):
        new = cls(**kw)
        db.add(new)
        db.commit()
        return new
    
    @classmethod
    def retrieve(cls, db: Session, folder_id: str, image_name: str):
        return db.query(cls).filter(cls.folder_id == folder_id, cls.image_name == image_name).all()
    
    @classmethod
    def update(cls, db: Session, folder_id: str, old_image_name: str, new_image_name: str):
        predictions = db.query(cls).filter(
            cls.folder_id == folder_id, cls.image_name == old_image_name
        ).all()

        for prediction in predictions:
            prediction.image_name = new_image_name
        db.commit()