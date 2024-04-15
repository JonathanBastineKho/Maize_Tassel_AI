from fastapi import FastAPI
from app.routers import guest

# Initiate route
app = FastAPI()
app.include_router(guest.router)