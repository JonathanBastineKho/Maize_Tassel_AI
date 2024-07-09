from fastapi import APIRouter, Depends, HTTPException, UploadFile, Request
from sqlalchemy.orm import Session
from app.database.schema import User
from app.database.schema import TypeOfUser
from app.database.utils import get_db
from app.utils.payload import LoginRequired, UserUpdateRequest
from app.utils import storage_mgr, session_mgr
import re

router = APIRouter(tags=["Profile"], prefix="/profile")

@router.patch("/update-account")
def update_account(
    updated_user: UserUpdateRequest,
    request: Request,
    user:dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM})), 
    db: Session = Depends(get_db)
    ):

    update_data = updated_user.model_dump(exclude_unset=True)

    name_parts = update_data['name'].split()
    if len(name_parts[0]) == 0 or name_parts[0] == "":
        raise HTTPException(400, detail="First name cannot be empty")
    if len(name_parts[0]) > 10:
        raise HTTPException(400, detail="First name must be 10 characters or fewer")
    if len(name_parts) > 1 and len(name_parts[1]) > 10:
        raise HTTPException(400, detail="Last name must be 10 characters or fewer")

    if 'phone' in update_data and len(update_data['phone']) > 13:
        raise HTTPException(400, detail="Phone number must be 13 characters or fewer")
    if not re.match(r'^[\w\s\.-]+$', update_data['phone']):
        raise HTTPException(400, detail="Phone number cannot contain special character")
    
    usr = User.update(db, email=user['email'], **update_data)
    session_mgr.logout_user(request)
    return session_mgr.login_user(email=usr.email, name=usr.name, verified=usr.verified, role=usr.role, profile_pict=usr.profile_pict, request=request)

@router.patch("/update-profile-pict")
async def update_profile_pict(
    file: UploadFile,
    request: Request,
    user:dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM})), 
    db: Session = Depends(get_db),
    ):
    response = await storage_mgr.upload_profile_pict(file, user['email'])
    path = response["image_path"]
    usr = User.update(db, email=user['email'], profile_pict=f"https://storage.googleapis.com/corn_sight_public/{path}")
    session_mgr.logout_user(request)
    return session_mgr.login_user(email=usr.email, name=usr.name, verified=usr.verified, role=usr.role, profile_pict=usr.profile_pict, request=request)

@router.get("/view-profile")
def view_profile(user:dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM})), db: Session = Depends(get_db)):
    usr = User.retrieve(db, email=user['email'])
    name_parts = usr.name.split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    return {
        "email" : usr.email,
        "phone" : usr.phone,
        "country" : usr.country,
        "first_name" : first_name,
        "last_name" : last_name,
        "profile_pict" : usr.profile_pict
    }
