import uuid
from sqlalchemy import Column, String, Boolean, Integer, Enum, UniqueConstraint, ForeignKey, ForeignKeyConstraint
from sqlalchemy.orm import relationship
from app.database import Base

# Production change
# from sqlalchemy.dialects.postgresql import UUID # Change to postgreSQL in production

class TypeOfUser(Enum):
    ADMIN = 'admin'
    REGULAR = 'regular'
    PREMIUM = 'premium'

class User(Base):
    __tablename__ = "users"
    email = Column(String, primary_key=True)
    name = Column(String)
    password = Column(String, nullable=True)
    verified = Column(Boolean, default=False)
    role = Column(Enum(TypeOfUser.ADMIN, TypeOfUser.REGULAR, TypeOfUser.PREMIUM), default=TypeOfUser.REGULAR)

class Folder(Base):
    __tablename__ = "folders"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4())) # Change to UUID data type during production
    name = Column(String)
    parent_id = Column(String(36), ForeignKey('folders.id'), nullable=True) # Change to UUID data type during production

    parent = relationship('Folder', remote_side=[id], backref='children')

    __table_args__ = (
        UniqueConstraint('name', 'parent_id'),
    )
    
class Image(Base):
    __tablename__ = "images"
    name = Column(String, primary_key=True)
    folder_id = Column(String(36), ForeignKey('folders.id'), primary_key=True)  # Change to UUID data type during production
    size = Column(Integer)
    width = Column(Integer)
    height = Column(Integer)
    imageURL = Column(String)
    processing_status = Column(Boolean, default=False)
    folder = relationship('Folder', backref='images')
    __table_args__ = (
        UniqueConstraint('name', 'folder_id'),
    )

class Prediction(Base):
    __tablename__ = "predictions"
    folder_id = Column(String(36), primary_key=True)  # Change to UUID data type during production
    image_name = Column(String, primary_key=True)
    box_id = Column(Integer, primary_key=True)
    xCenter = Column(Integer)
    yCenter = Column(Integer)
    width = Column(Integer)
    height = Column(Integer)
    image = relationship('Image', backref='predictions', primaryjoin='and_(Prediction.folder_id == Image.folder_id, Prediction.image_name == Image.name)')
    __table_args__ = (
        ForeignKeyConstraint(['folder_id', 'image_name'], ['images.folder_id', 'images.name']),
    )