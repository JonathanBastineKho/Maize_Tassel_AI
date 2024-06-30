from app.database import Base
from sqlalchemy import Column, String, ForeignKey, UniqueConstraint, ForeignKeyConstraint
from sqlalchemy.orm import relationship, Session, backref

class DatasetImageLink(Base):
    __tablename__ = "dataset_image_link"
    
    dataset_name = Column(String, ForeignKey('dataset.name'), primary_key=True)
    image_name = Column(String, primary_key=True)
    image_folder_id = Column(String(36), primary_key=True)
    image_url = Column(String)
    thumbnail_url = Column(String)

    dataset = relationship("Dataset", backref=backref("images", cascade="all, delete-orphan"))
    image = relationship("Image", 
                         backref=backref("datasets", cascade="all, delete-orphan"),
                         foreign_keys=[image_name, image_folder_id],
                         primaryjoin="and_(DatasetImageLink.image_name==Image.name, "
                                     "DatasetImageLink.image_folder_id==Image.folder_id)")

    __table_args__ = (
        UniqueConstraint('dataset_name', 'image_name', 'image_folder_id', name='uix_dataset_image'),
        ForeignKeyConstraint(['image_name', 'image_folder_id'], ['images.name', 'images.folder_id'],
                             onupdate="CASCADE"),
    )

    @classmethod
    def create(cls, db: Session, **kw):
        new = cls(**kw)
        db.add(new)
        db.commit()
        return new