import os
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))
class Config:
    SECRET_KEY= os.environ.get("SECRET_KEY")
    PRIVATE_BUCKET_NAME = os.environ.get("PRIVATE_BUCKET_NAME")
    FINISH_PREDICT_URL = os.environ.get("FINISH_PREDICT_URL")
    UPDATE_STATUS_URL = os.environ.get("UPDATE_STATUS_URL")
    RABBIT_QUEUE = os.environ.get("RABBIT_QUEUE")
    RABBIT_HOST = os.environ.get("RABBIT_HOST")
    RABBIT_PORT = os.environ.get("RABBIT_PORT") or 5672
    MODEL_URL = os.environ.get("MODEL_URL") # CHANGE THIS WHEN IMPLEMENTING MACHINE LEARNING MAINTENANCE