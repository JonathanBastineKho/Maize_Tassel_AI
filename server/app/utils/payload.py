from fastapi import Request, HTTPException
from . import session_mgr
from pydantic import BaseModel
from typing import Set

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