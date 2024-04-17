from sqlalchemy import Column, String
from app.database import Base
from enum import enum

class UserType(enum):
    ADMIN = 'Admin'
    GUEST = 'Guest'
    REGULAR = 'Regular'
    PREMIUM = 'Premium'
class User(Base):
    __tablename__ = "users"
    email = Column(String, primary_key=True)
    password = Column(String)
    userType = Column(enum(UserType))