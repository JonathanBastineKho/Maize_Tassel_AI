from fastapi import FastAPI, APIRouter
from app.database.utils import create_database
from app.routers import auth, webhook, service
from app.utils.sockets import sio_app

 # Create Database
create_database()

# Initiate route
app = FastAPI()
app.mount("/job_socket", sio_app)
api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(service.router)
api_router.include_router(webhook.router)

app.include_router(api_router)