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
    #check for same email in the database
    db_user = db.query(User).filter(User.email == user['email']).first()
    #checks whether password is below 8 characters long
    if updated_user.password and len(updated_user.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
    #prevent password change if the user logged in via Google
    if db_user.password is None and updated_user.password:
        raise HTTPException(status_code=400, detail="Cannot change password for Google authenticated users")
    #mapping of fields to be updated
    fields_to_update = {
        'name': updated_user.name,
        'country': updated_user.country,
        'phone': updated_user.phone,
    }
    #loop through the dictionary
    for field, value in fields_to_update.items():
        if value:
            setattr(db_user, field, value)

    #only update the password if it's provided
    if updated_user.password:
        db_user.password = hashpw(updated_user.password.encode('utf-8'), gensalt())
            
    db.commit()
    return {"Success" : True}

@router.patch("/update-profile-pict")
def update_profile_pict(
    file: UploadFile, 
    user:dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM})), 
    db: Session = Depends(get_db)
    ):
    #check for same email in the database
    db_user = db.query(User).filter(User.email == user['email']).first()    
    #handle profile_pict upload
    if file:
        #upload profile_pict and generate signed url
        response = storage_mgr.upload_profile_pict(file, user['email'])
        path = response["image_path"]
        db_user.profile_pict = f"https://storage.googleapis.com/corn_sight_public/{path}"
    elif not db_user.profile_pict:
        db_user.profile_pict = 'https://storage.googleapis.com/corn_sight_public/default_profile.jpg'
    db.commit()
    return {"Success" : True}