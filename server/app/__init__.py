from fastapi import FastAPI, APIRouter
from app.database.utils import create_database
from app.routers import auth, user

 # Create Database
create_database()

# Initiate route
app = FastAPI()
api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(user.router)

app.include_router(api_router)