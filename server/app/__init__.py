from fastapi import FastAPI, APIRouter
from config import Config
import stripe
from app.database.utils import create_database
from app.routers import auth, webhook, service, user, profile, subscription, maintenance
from app.utils.sockets import sio_app

# Initialize stripe
stripe.api_key = Config.STRIPE_SECRET

 # Create Database
create_database()

# Initiate route
app = FastAPI()
app.mount("/job_socket", sio_app)
api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(service.router)
api_router.include_router(webhook.router)
api_router.include_router(user.router)
api_router.include_router(subscription.router)
api_router.include_router(profile.router)
api_router.include_router(maintenance.router)

app.include_router(api_router)