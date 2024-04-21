from sqlalchemy import Column, String, Boolean, Enum
from app.database import Base

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