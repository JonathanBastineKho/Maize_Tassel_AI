from fastapi import HTTPException
from fastapi_mail import MessageSchema, MessageType, FastMail, ConnectionConfig
from itsdangerous import URLSafeTimedSerializer
from config import Config, MailConf
from jinja2 import Environment, FileSystemLoader
from app.database.schema import TypeOfImageStatus

class EmailSender:
    def __init__(self, secret_key:str=Config.SECRET_KEY, mail_conf:ConnectionConfig=MailConf) -> None:
        self.serializer = URLSafeTimedSerializer(secret_key)
        self.fm = FastMail(mail_conf)
        self.env = Environment(loader=FileSystemLoader('app/templates/'))

    async def send_confirm_email(self, email:str):
        token = self.serializer.dumps({"purpose" : "email", "email" : email})
        template = self.env.get_template('VerifyAccount.html')
        html_body = template.render(link=f"{Config.CONFIRMATION_LINK}/{token}", email=email)
        message = MessageSchema(
            subject="Confirmation Email",
            recipients=[email],
            body=html_body,
            subtype=MessageType.html)
        await self.fm.send_message(message)
        return token
    
    async def send_reset_password(self, email:str):
        token = self.serializer.dumps({"purpose" : "reset_password", "email" : email})
        template = self.env.get_template('ResetPassword.html')
        html_body = template.render(link=f"{Config.RESET_PASSWORD_LINK}/{token}", email=email)
        message = MessageSchema(
            subject="Reset Your Password",
            recipients=[email],
            body=html_body,
            subtype=MessageType.html)
        await self.fm.send_message(message)
        return token

    def check_token(self, token:str, purpose:str, max_age:int):
        try:
            valid_token = self.serializer.loads(token, max_age=max_age)
        except:
            raise HTTPException(status_code=400, detail="Invalid or expired token")
        # Check if token is used for email
        if valid_token["purpose"] != purpose:
            raise HTTPException(status_code=400, detail="Invalid or expired token")
        
        return valid_token
    
    async def send_prediction_email(self, email: str, link: str, status: TypeOfImageStatus):
        template = self.env.get_template('NotificationEmail.html')
        msg = "Your Image has done processing" if status == TypeOfImageStatus.DONE else "There are error in processing your image"
        html_body = template.render(link=link, message=msg, email=email)
        message = MessageSchema(
            subject="Prediction Results Out",
            recipients=[email],
            body=html_body,
            subtype=MessageType.html
        )
        await self.fm.send_message(message)