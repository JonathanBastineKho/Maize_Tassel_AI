import uuid
from datetime import timezone
from sqlalchemy import func, DateTime, Column, String, Boolean, Integer, Float, Enum, UniqueConstraint, ForeignKey, ForeignKeyConstraint
from sqlalchemy.orm import relationship, backref
from app.database import Base

# Production change
# from sqlalchemy.dialects.postgresql import UUID # Change to postgreSQL in production

class TypeOfUser(Enum):
    ADMIN = 'admin'
    REGULAR = 'regular'
    PREMIUM = 'premium'

class TypeOfImageStatus(Enum):
    IN_QUEUE = "in_queue"
    PROCESSING = "processing"
    DONE = "done"
    ERROR = "error"

class User(Base):
    __tablename__ = "users"
    email = Column(String, primary_key=True)
    name = Column(String)
    password = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    country = Column(String, nullable=True)
    profile_pict = Column(String, default="https://storage.googleapis.com/corn_sight_public/default_profile.jpg")
    verified = Column(Boolean, default=False)
    role = Column(Enum(TypeOfUser.ADMIN, TypeOfUser.REGULAR, TypeOfUser.PREMIUM), default=TypeOfUser.REGULAR)

class Suspension(Base):
    __tablename__ = "suspensions"
    user_email = Column(String, ForeignKey('users.email'), primary_key=True)
    start_date = Column(DateTime(timezone=True), primary_key=True)
    end_date = Column(DateTime(timezone=True))
    suspension = Column(String)
    user = relationship('User', backref='suspensions')

class Folder(Base):
    __tablename__ = "folders"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4())) # Change to UUID data type during production
    name = Column(String)
    parent_id = Column(String(36), ForeignKey('folders.id'), nullable=True) # Change to UUID data type during production
    user_email = Column(String, ForeignKey('users.email'), nullable=False)
    create_date = Column(DateTime(timezone=True), server_default=func.now(timezone=timezone.utc))
    parent = relationship('Folder', remote_side=[id], backref='children')
    user = relationship('User', backref='folders')

    __table_args__ = (
        UniqueConstraint('name', 'parent_id', 'user_email'),
    )
    
class Image(Base):
    __tablename__ = "images"
    name = Column(String, primary_key=True)
    description = Column(String)
    folder_id = Column(String(36), ForeignKey('folders.id'), primary_key=True)  # Change to UUID data type during production
    size = Column(Integer)
    width = Column(Integer)
    height = Column(Integer)
    image_url = Column(String)
    thumbnail_url = Column(String)
    processing_status = Column(Enum(TypeOfImageStatus.IN_QUEUE, TypeOfImageStatus.PROCESSING, TypeOfImageStatus.DONE, TypeOfImageStatus.ERROR), default=TypeOfImageStatus.IN_QUEUE)
    upload_date = Column(DateTime(timezone=True), server_default=func.now(timezone=timezone.utc))
    finish_date = Column(DateTime(timezone=True))
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
    confidence = Column(Float)
    image = relationship('Image', backref=backref('predictions', cascade='all, delete-orphan'), 
                         primaryjoin='and_(Prediction.folder_id == Image.folder_id, Prediction.image_name == Image.name)')

    __table_args__ = (
        ForeignKeyConstraint(['folder_id', 'image_name'], ['images.folder_id', 'images.name']),
    )