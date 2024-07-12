import os
from dotenv import load_dotenv
from fastapi_mail import ConnectionConfig

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))
class Config:
    # Fast API configuration
    SECRET_KEY = os.environ.get("SECRET_KEY") or "dont-share-my-secret"
    DATABASE_URL = os.environ.get("DATABASE_URL") or "sqlite:///./app.db"
    CONFIRMATION_LINK = os.environ.get("CONFIRMATION_EMAIL") or "http://localhost:5173/confirm"
    RESET_PASSWORD_LINK = os.environ.get("RESET_PASSWORD") or "http://localhost:5173/reset-password"
    ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL")
    ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD")

    # Third Party
    GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")
    GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
    PRIVATE_BUCKET_NAME = os.environ.get("PRIVATE_BUCKET_NAME") or "corn_sight_private"
    PUBLIC_BUCKET_NAME = os.environ.get("PUBLIC_BUCKET_NAME") or "corn_sight_public"
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD")
    STRIPE_SECRET = os.environ.get("STRIPE_SECRET")
    STRIPE_WEBHOOK = os.environ.get("STRIPE_WEBHOOK")
    GOOGLE_CLOUD_RUN_KEY = os.environ.get("GOOGLE_CLOUD_RUN_KEY")
    GOOGLE_APPLICATION_CREDENTIALS = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    GOOGLE_PROJECT_ID = os.environ.get("GOOGLE_PROJECT_ID")

    # OpenWeather
    OPEN_WEATHER_API = os.environ.get("OPEN_WEATHER_API")

    # RabbitMQ
    RABBIT_MQ_USERNAME = os.environ.get("RABBIT_MQ_USERNAME")
    RABBIT_MQ_PASSWORD = os.environ.get("RABBIT_MQ_PASSWORD")


MailConf = ConnectionConfig(
    MAIL_USERNAME = Config.MAIL_USERNAME,
    MAIL_PASSWORD = Config.MAIL_PASSWORD,
    MAIL_FROM = "service@cornhub.com",
    MAIL_PORT = 465,
    MAIL_SERVER = "smtp.gmail.com",
    MAIL_STARTTLS = False,
    MAIL_SSL_TLS = True,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)