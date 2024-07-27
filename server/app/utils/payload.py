import re
from fastapi import Request, HTTPException
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Set, List, Optional, Literal
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

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    country: Optional[str] = None
    phone: Optional[str] = None

class suspendUserRequest(UserRequest):
    duration: int
    category: str
    reason: str

class googleAuth(BaseModel):
    auth_code: str

# service
class FolderPayload(BaseModel):
    folder_id: Optional[str] = None

class ImagePayload(FolderPayload):
    name: str

class ImageFeedback(ImagePayload):
    good: bool

class JobStatus(ImagePayload):
    job_status: str
    job_id: Optional[str] = None
    email: str

class JobPrediction(ImagePayload):
    box: List[dict]
    job_id: Optional[str] = None
    email: str

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
    
class RenameFolderBody(FolderPayload):
    new_name: str
    
class RenameImageBody(ImagePayload):
    new_name : str  
    
class CreateDataset(BaseModel):
    name: str

    @field_validator('name')
    @classmethod
    def name_must_be_valid(cls, v: str) -> str:
        if not v.strip():
            raise ValueError('Dataset name cannot be empty')
        if not re.match(r'^[a-zA-Z0-9]+$', v):
            raise ValueError('Dataset name can only contain letters and numbers')
        return v

class TrainParams(BaseModel):
    dataset_names: List[str]
    base_model_version: int = Field(..., ge=0)
    epochs: int = Field(100, ge=1, le=500)
    patience: int = Field(10, ge=1, le=50)
    batch: int = Field(16, ge=1, le=16)
    dropout: float = Field(0.1, ge=0.0, le=1.0)
    optimizer: str = Field("Adam", pattern='^(sgd|adam|adamw|Adam)$')
    learning_rate: float = Field(0.001, gt=0, le=1)
    freeze_layers: int = Field(10, ge=8)
    imgsz: int = Field(860, ge=32, le=1024)

class MetricsModel(BaseModel):
    map50: float
    mae: float

class TrainingHookPayload(BaseModel):
    model_config  = ConfigDict(protected_namespaces=())
    status: Literal["benchmark", "training"]
    model_version: Optional[int] = None
    run_id: str
    metrics: Optional[MetricsModel] = None

class DeployModel(BaseModel):
    version: int

class ReannotateImage(BaseModel):
    image_name: str
    folder_id: str
    dataset_name: str
    new_label: List[dict]

class CroppedImage(BaseModel):
    image_name: str
    folder_id: str
    dataset_name: str
    crop_data: dict

class FutureYieldInput(BaseModel):
    weather_forecast: list
    historical_count: list