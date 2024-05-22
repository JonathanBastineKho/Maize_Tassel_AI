from config import Config
from typing import Dict
import redis
import secrets
from collections import defaultdict
from itsdangerous import URLSafeSerializer
from fastapi import Response, Request, HTTPException, Request, WebSocket
from app.database.schema import TypeOfUser

class SessionManager:
    def __init__(self, host:str="localhost", port=6379) -> None:
        self.session_key = "session"
        self.email_key = "email_session"
        self.r = redis.Redis(host=host, port=port, decode_responses=True)
        self.serializer = URLSafeSerializer(Config.SECRET_KEY)
        self.connections: Dict[str, WebSocket] = defaultdict(set)  # Store WebSocket connections

    def load_signed_session(self, session):
        try:
            return self.serializer.loads(session)
        except:
            return None
        
    def check_if_already_logged_in(self, request:Request):
        # Check if users already logged in
        session_token = request.cookies.get(self.session_key)
        # Check signature
        session_token = self.load_signed_session(session_token)
        # Check if already logged in
        if session_token and self.r.exists(session_token):
            raise HTTPException(status_code=403, detail="Users already Logged in")

    def login_user(self, email:str, name:str, verified:bool, role:str, request: Request, profile_pict:str = "https://storage.googleapis.com/corn_sight_public/default_profile.jpg"):
        
        self.check_if_already_logged_in(request)
        
        # generate a secure session token
        while True:
            session_token = secrets.token_urlsafe(32)
            if not self.r.exists(session_token):
                data = {
                    "email" : email,
                    "role" : role,
                    "name" : name,
                    "verified" : int(verified),
                    "profile_pict" : profile_pict
                }
                self.r.hmset(session_token, data)
                self.r.expire(session_token, 86400)
                self.r.sadd(f"{self.email_key}:{email}", session_token)
                self.r.expire(f"{self.email_key}:{email}", 86400)
                break

        # Setting the signed session to the user
        response = Response(content="Login Successful", 
                        media_type="text/plain")
        response.set_cookie(key=self.session_key, 
                            value=self.serializer.dumps(session_token), 
                            httponly=True)
        return response

    def logout_user(self, request:Request):
        # Check if users already Logged out
        response = Response(content="Logged out Successfully",
                            media_type="text/plain")
        response.delete_cookie(self.session_key)
        session_token = self.load_signed_session(request.cookies.get(self.session_key))
        email = self.r.hget(session_token, "email")
        self.r.delete(session_token)
        self.r.srem(f"{self.email_key}:{email}", session_token)
        return response
    
    def upgrade_user(self, email: str):
        session_tokens = self.r.smembers(f"{self.email_key}:{email}")
        for session_token in session_tokens:
            self.r.hset(session_token, "role", TypeOfUser.PREMIUM)

    def downgrade_user(self, email: str):
        session_tokens = self.r.smembers(f"{self.email_key}:{email}")
        for session_token in session_tokens:
            self.r.hset(session_token, "role", TypeOfUser.REGULAR)