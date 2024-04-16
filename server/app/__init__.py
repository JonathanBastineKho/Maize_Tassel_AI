from fastapi import FastAPI
from app.routers import guest
from app.database.utils import create_database

# Create Database
create_database()

# Initiate route
app = FastAPI()
app.include_router(guest.router)