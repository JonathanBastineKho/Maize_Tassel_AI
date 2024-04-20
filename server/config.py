import os
from dotenv import load_dotenv
from fastapi_mail import ConnectionConfig

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))
class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY") or "dont-share-my-secret"
    DATABASE_URL = os.environ.get("DATABASE_URL") or "sqlite:///./app.db"
    CONFIRMATION_LINK = os.environ.get("CONFIRMATION_EMAIL") or "http://localhost:3000/confirm"
    GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")
    GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")

MailConf = ConnectionConfig(
    MAIL_USERNAME ="jojotinggi@gmail.com",
    MAIL_PASSWORD = "iuaj eije bqlc yyvb",
    MAIL_FROM = "service@cornhub.com",
    MAIL_PORT = 465,
    MAIL_SERVER = "smtp.gmail.com",
    MAIL_STARTTLS = False,
    MAIL_SSL_TLS = True,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)