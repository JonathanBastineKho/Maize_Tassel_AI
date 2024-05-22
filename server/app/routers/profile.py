from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.schema import User
from app.database.schema import TypeOfUser
from app.database.utils import get_db
from app.utils.payload import LoginRequired, UserUpdateRequest
from bcrypt import hashpw, gensalt

router = APIRouter(tags=["Profile"], prefix="/profile")

@router.patch("/update-account")
async def update_account(update_user : UserUpdateRequest, user:dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM})), db: Session = Depends(get_db)):
    #check for same email in the database
    db_user = db.query(User).filter(User.email == user['email']).first()
    #ensure fields are not empty
    if not update_user.name:
        raise HTTPException(status_code=400, detail="Name cannot be empty")
    if len(update_user.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
    #mapping of fields to be updated
    fields_to_update = {
        'name': update_user.name,
        'password': update_user.password,
        'country': update_user.country,
        'phone': update_user.phone,
        'profile_pict': update_user.profile_pict
    }
    #loop through the dictionary
    for field, value in fields_to_update.items():
        if field == 'password' and value:
            setattr(db_user, field, hashpw(value.encode('utf-8'), gensalt()))
        elif value:
            setattr(db_user, field, value)
        elif field == 'profile_pict' and not value:
            setattr(db_user, field, 'https://storage.googleapis.com/corn_sight_public/default_profile.jpg')
        elif not value:
            setattr(db_user, field, None)
    db.commit()
    return {"Success" : True}