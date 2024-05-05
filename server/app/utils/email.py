from fastapi import HTTPException
from fastapi_mail import MessageSchema, MessageType, FastMail, ConnectionConfig
from itsdangerous import URLSafeTimedSerializer
from config import Config, MailConf
from jinja2 import Environment, FileSystemLoader

class EmailSender:
    def __init__(self, secret_key:str=Config.SECRET_KEY, mail_conf:ConnectionConfig=MailConf) -> None:
        self.serializer = URLSafeTimedSerializer(secret_key)
        self.fm = FastMail(mail_conf)

    async def send_confirm_email(self, email:str):
        token = self.serializer.dumps({"purpose" : "email", "email" : email})
        env = Environment(loader=FileSystemLoader('app/templates/'))
        template = env.get_template('VerifyAccount.html')
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
        env = Environment(loader=FileSystemLoader('app/templates/'))
        template = env.get_template('ResetPassword.html')
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