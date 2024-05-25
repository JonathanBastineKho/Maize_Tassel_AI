from fastapi import Request, HTTPException
from pydantic import BaseModel
from typing import Set, List, Optional
from . import session_mgr
from app.database.schema import TypeOfUser

# JSON FORMAT
# Authentication
class UserRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    password: str

class UserLoginRequest(UserRequest):
    password: str

class UserCreateRequest(UserRequest):
    name: str
    password: str

class UserUpdateRequest(UserRequest):
    name: str
    password: str
    country: str
    phone: str
    profile_pict: str

class googleAuth(BaseModel):
    auth_code: str

# service
class FolderPayload(BaseModel):
    folder_id: Optional[str] = None

class ImagePayload(FolderPayload):
    name: str

class JobStatus(ImagePayload):
    job_status: str

class JobPrediction(ImagePayload):
    box: List[dict]

class CheckoutSessionRequest(BaseModel):
    is_monthly: bool = True

# Dependencies 
class LoginRequired:
    def __init__(self, verified: bool = True, roles_required: Set[str] = set({TypeOfUser.ADMIN, TypeOfUser.REGULAR, TypeOfUser.PREMIUM})):
        self.verified = verified
        self.roles_required = roles_required

    async def verify_session_id(self, session_id: str):
        return await self.verify_session(session_id)

    async def verify_session(self, signed_session: str):
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

    async def __call__(self, request: Request):
        signed_session = request.cookies.get(session_mgr.session_key)
        return await self.verify_session(signed_session)
    
# Utilities 
class CreateFolderBody(BaseModel):
    folder_name : str
    parent_id : Optional[str] = None
    
class SuspendAccountRequest(BaseModel):
    email: str 
    category: str
    detail : str
    duration: Optional[int] = None
