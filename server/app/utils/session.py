from config import Config
from typing import Dict
import redis
import secrets
from itsdangerous import URLSafeSerializer
from fastapi import Response, Request, HTTPException, Request, WebSocket

class SessionManager:
    def __init__(self, host:str="localhost", port=6379) -> None:
        self.session_key = "session"
        self.r = redis.Redis(host=host, port=port, decode_responses=True)
        self.serializer = URLSafeSerializer(Config.SECRET_KEY)
        self.connections: Dict[str, WebSocket] = {}  # Store WebSocket connections

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

    def login_user(self, email:str, name:str, verified:bool, role:str, request: Request):
        
        self.check_if_already_logged_in(request)
        
        # generate a secure session token
        while True:
            session_token = secrets.token_urlsafe(32)
            if not self.r.exists(session_token):
                data = {
                    "email" : email,
                    "role" : role,
                    "name" : name,
                    "verified" : int(verified)
                }
                self.r.hmset(session_token, data)
                self.r.expire(session_token, 7200)
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
        self.r.delete(self.load_signed_session(request.cookies.get(self.session_key)))
        return response