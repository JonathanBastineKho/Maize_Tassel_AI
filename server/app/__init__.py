from fastapi import FastAPI, APIRouter
from config import Config
import stripe, wandb
from app.database.utils import create_database
from app.routers import auth, webhook, service, user, profile, subscription, maintenance, ai_service
from app.utils.sockets import sio_app

# Wandb Login
wandb.ensure_configured()
if wandb.api.api_key is None:
    wandb.login(key=Config.WANDB_API)

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
api_router.include_router(ai_service.router)

app.include_router(api_router)