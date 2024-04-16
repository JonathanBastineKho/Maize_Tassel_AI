import os
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))
class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY") or "dont-share-my-secret"
    DATABASE_URL = os.environ.get("DATABASE_URL") or "sqlite:///./app.db"