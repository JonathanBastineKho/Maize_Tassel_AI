from config import Config
import redis
import secrets
from itsdangerous import URLSafeSerializer
from fastapi import Response, Request, HTTPException, Request

class SessionManager:
    def __init__(self, host:str="localhost", port=6379) -> None:
        self.session_key = "session"
        self.r = redis.Redis(host=host, port=port, decode_responses=True)
        self.serializer = URLSafeSerializer(Config.SECRET_KEY)

    def load_signed_session(self, session):
        try:
            return self.serializer.loads(session)
        except:
            return None

    def login_user(self, email:str, request: Request):
        # Check if users already logged in
        session_token = request.cookies.get(self.session_key)
        print(session_token)
        # Check signature
        session_token = self.load_signed_session(session_token)
        # Check if already logged in
        if session_token and self.r.exists(session_token):
            raise HTTPException(status_code=403, detail="Users already Logged in")
        
        # generate a secure session token
        while True:
            session_token = secrets.token_urlsafe(32)
            if not self.r.exists(session_token):
                self.r.set(session_token, email, 7200)
                break
        # Setting the signed session to the user
        response = Response(content="Login Successful", 
                        media_type="text/plain")
        response.set_cookie(key=self.session_key, 
                            value=self.serializer.dumps(session_token), 
                            httponly=True)
        return response

    def verify_session(self, request: Request) -> str:
        signed_session = request.cookies.get(self.session_key)
        # Check if session signature valid
        if not signed_session:
            raise HTTPException(status_code=401, detail="Unauthorized")
        
        # Check if session valid
        session_token = self.load_signed_session(signed_session)
        if not session_token or not self.r.exists(session_token):
            raise HTTPException(status_code=401, detail="Unauthorized")
        
        return self.r.get(session_token)

    def logout_user(self, request:Request):
        # Check if users already Logged out
        self.verify_session(request)
        response = Response(content="Logged out Successfully",
                            media_type="text/plain")
        response.delete_cookie(self.session_key)
        self.r.delete(self.load_signed_session(request.cookies.get(self.session_key)))
        return response