from fastapi import APIRouter, Depends, HTTPException, UploadFile, Form
from sqlalchemy.orm import Session
from app.database.schema import User
from app.database.schema import TypeOfUser
from app.database.utils import get_db
from app.utils.payload import LoginRequired, UserUpdateRequest
from app.utils import storage_mgr
from bcrypt import hashpw, gensalt


router = APIRouter(tags=["Profile"], prefix="/profile")

@router.patch("/update-account")
def update_account(
    updated_user: UserUpdateRequest, 
    user:dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM})), 
    db: Session = Depends(get_db)
    ):

    update_data = updated_user.model_dump(exclude_unset=True)
    # check if password being updated
    if 'password' in update_data:
        if len(update_data['password']) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
        update_data['password'] = hashpw(update_data['password'].encode('utf-8'), gensalt())

    User.update(db, email=user['email'], **update_data)
    return {"Success" : True}

@router.patch("/update-profile-pict")
def update_profile_pict(
    file: UploadFile, 
    user:dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM})), 
    db: Session = Depends(get_db)
    ):
    response = storage_mgr.upload_profile_pict(file, user['email'])
    path = response["image_path"]
    User.update(db, email=user['email'], profile_pict=f"https://storage.googleapis.com/corn_sight_public/{path}")
    return {"Success" : True}