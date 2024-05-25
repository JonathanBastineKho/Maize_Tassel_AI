from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from app.utils.payload import LoginRequired, suspendUserRequest
from app.database.schema import TypeOfUser, User, Suspension
from app.database.utils import get_db
from app.utils import session_mgr

router = APIRouter(tags=["User"], prefix="/user")

@router.get("/search-user")
def search_user(page: int = 1, page_size: int = 20, search: str = None, db: Session = Depends(get_db), user: dict = Depends(LoginRequired(roles_required={TypeOfUser.ADMIN}))):
    offset = (page - 1) * page_size
    users = User.search(db, offset=offset, page_size=page_size, search=search)

    user_data = []
    for user in users:
        suspension_status = False
        suspension = Suspension.retrieve(db, email=user.email, date=datetime.now())

        if suspension:
            suspension_status = True

        user_data.append({
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "phone": user.phone,
            "country": user.country,
            "verified": user.verified,
            "profile_pict" : user.profile_pict,
            "suspended": suspension_status
        })

    return {"users": user_data}

@router.get("/view-account")
def view_account(user:dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM})), db: Session = Depends(get_db)):
    db_user = User.retrieve(db, email=user['email'])
    return db_user

@router.post("/suspend-account")
def suspend_account(request: Request, 
                    suspend_user: suspendUserRequest, 
                    db: Session = Depends(get_db),
                    _: dict = Depends(LoginRequired(roles_required={TypeOfUser.ADMIN}))):
    #check if email is already suspended
    try:
        Suspension.create(db, user_email=suspend_user.email,
        start_date=datetime.now(),
        end_date=suspend_user.end_date,
        reason=suspend_user.reason)
    except IntegrityError:
        raise HTTPException(400, detail="User already suspended")
    
    return session_mgr.logout_user(request)