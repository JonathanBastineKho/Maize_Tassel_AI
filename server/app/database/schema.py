from sqlalchemy import Column, String
from app.database import Base

class User(Base):
    __tablename__ = "users"
    email = Column(String, primary_key=True)
    password = Column(String)