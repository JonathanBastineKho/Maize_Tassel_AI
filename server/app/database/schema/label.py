from app.database import Base
from typing import List
from sqlalchemy import Column, String, Integer, ForeignKeyConstraint
from sqlalchemy.orm import relationship, backref, Session

class Label(Base):
    __tablename__ = "label"
    dataset_name = Column(String, primary_key=True)
    image_name = Column(String, primary_key=True)
    image_folder_id = Column(String(36), primary_key=True)
    box_id = Column(Integer, primary_key=True)
    xCenter = Column(Integer)
    yCenter = Column(Integer)
    width = Column(Integer)
    height = Column(Integer)

    dataset_image_link = relationship("DatasetImageLink", 
                                      backref=backref("labels", cascade="all, delete-orphan"),
                                      foreign_keys=[dataset_name, image_name, image_folder_id],
                                      primaryjoin="and_(Label.dataset_name==DatasetImageLink.dataset_name, "
                                                  "Label.image_name==DatasetImageLink.image_name, "
                                                  "Label.image_folder_id==DatasetImageLink.image_folder_id)")
    
    __table_args__ = (
        ForeignKeyConstraint(
            ['dataset_name', 'image_name', 'image_folder_id'],
            ['dataset_image_link.dataset_name', 'dataset_image_link.image_name', 'dataset_image_link.image_folder_id'],
            onupdate='CASCADE'
        ),
    )

    @classmethod
    def create(cls, db: Session, **kw):
        new = cls(**kw)
        db.add(new)
        db.commit()
        return new
    
    @classmethod
    def retrieve(cls, db: Session, dataset_name: str, folder_id: str, image_name: str):
        return db.query(cls).filter(cls.dataset_name == dataset_name, cls.image_folder_id == folder_id, cls.image_name == image_name).all()
    
    @classmethod
    def update(cls, db: Session, dataset_name: str, folder_id: str, image_name: str, new_labels: List[dict]):
        try:
            # Delete existing labels
            db.query(cls).filter(
                cls.dataset_name == dataset_name,
                cls.image_folder_id == folder_id,
                cls.image_name == image_name
            ).delete(synchronize_session=False)

            # Create new labels
            for index, label in enumerate(new_labels, start=1):
                new_label = cls(
                    dataset_name=dataset_name,
                    image_folder_id=folder_id,
                    image_name=image_name,
                    box_id=label.get('box_id') or index,  # Use provided box_id or generate a new one
                    xCenter=label.get('xCenter'),
                    yCenter=label.get('yCenter'),
                    width=label.get('width'),
                    height=label.get('height')
                )
                db.add(new_label)

            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Error updating labels: {str(e)}")
            raise

        return cls.retrieve(db, dataset_name, folder_id, image_name)
