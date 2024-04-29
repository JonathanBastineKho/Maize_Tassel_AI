from fastapi import Request, HTTPException
from app.database import session_mgr
from pydantic import BaseModel
from typing import Set
from fastapi_mail import MessageSchema, MessageType, FastMail
from itsdangerous import URLSafeTimedSerializer
from config import Config, MailConf
from jinja2 import Environment, FileSystemLoader

class UserRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    password: str

class UserLoginRequest(UserRequest):
    password: str

class UserCreateRequest(UserRequest):
    name: str
    password: str

class googleAuth(BaseModel):
    auth_code: str

class LoginRequired:
    def __init__(self, verified: bool = False, roles_required: Set[str] = set({"admin", "regular", "premium"})):
        self.verified = verified
        self.roles_required = roles_required

    async def __call__(self, request: Request):
        signed_session = request.cookies.get(session_mgr.session_key)
        # Check if session available
        if not signed_session:
            raise HTTPException(status_code=401, detail="Unauthorized")
        
        # Check if session signature valid
        session_token = session_mgr.load_signed_session(signed_session)
        if not session_token or not session_mgr.r.exists(session_token):
            raise HTTPException(status_code=401, detail="Unauthorized")
        
        user = session_mgr.r.hgetall(session_token)
        user["verified"] = bool(int(user["verified"]))

        # Check if need user to be verified
        if self.verified and not user["verified"]:
            raise HTTPException(status_code=403, detail="User not yet verified")
        
        # Check if roles match
        if user["role"] not in self.roles_required:
            raise HTTPException(status_code=401, detail="Unauthorized")
        
        return user
    
class EmailSender:
    serializer = URLSafeTimedSerializer(Config.SECRET_KEY)
    fm = FastMail(MailConf)

    @staticmethod
    async def send_confirm_email(email:str):
        token = EmailSender.serializer.dumps({"purpose" : "email", "email" : email})
        env = Environment(loader=FileSystemLoader('app/templates/'))
        template = env.get_template('VerifyAccount.html')
        html_body = template.render(link=f"{Config.CONFIRMATION_LINK}/{token}", email=email)
        message = MessageSchema(
            subject="Confirmation Email",
            recipients=[email],
            body=html_body,
            subtype=MessageType.html)
        await EmailSender.fm.send_message(message)
        return token
    
    @staticmethod
    async def send_reset_password(email:str):
        token = EmailSender.serializer.dumps({"purpose" : "reset_password", "email" : email})
        env = Environment(loader=FileSystemLoader('app/templates/'))
        template = env.get_template('ResetPassword.html')
        html_body = template.render(link=f"{Config.RESET_PASSWORD_LINK}/{token}", email=email)
        message = MessageSchema(
            subject="Reset Your Password",
            recipients=[email],
            body=html_body,
            subtype=MessageType.html)
        await EmailSender.fm.send_message(message)
        return token

    @staticmethod
    def check_token(token:str, purpose:str, max_age:int):
        try:
            valid_token = EmailSender.serializer.loads(token, max_age=max_age)
        except:
            raise HTTPException(status_code=400, detail="Invalid or expired token")
        # Check if token is used for email
        if valid_token["purpose"] != purpose:
            raise HTTPException(status_code=400, detail="Invalid or expired token")
        
        return valid_token