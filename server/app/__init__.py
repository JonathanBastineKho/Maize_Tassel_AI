from fastapi import FastAPI
from app.database.utils import create_database
from app.routers import auth

# Create Database
create_database()

# Initiate route
app = FastAPI()
app.include_router(auth.router)