from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime
from app.utils.payload import LoginRequired, suspendUserRequest
from app.database.schema import TypeOfUser, User, Suspension
from app.database.utils import get_db
from app.utils import session_mgr

router = APIRouter(tags=["User"], prefix="/user")

@router.get("/search-user")
def search_user(page: int = 1, page_size: int = 5, search: str = None, db: Session = Depends(get_db), user: dict = Depends(LoginRequired(roles_required={TypeOfUser.ADMIN}))):
    offset = (page - 1) * page_size
    query = db.query(User).filter(User.role != TypeOfUser.ADMIN)

    if search:
        query = query.filter(or_(
            User.name.ilike(f"%{search}%"),
            User.email.ilike(f"%{search}%")
        ))

    users = query.offset(offset).limit(page_size).all()

    user_data = []
    for user in users:
        suspension_status = False
        suspension = db.query(Suspension).filter(
            Suspension.user_email == user.email,
            Suspension.start_date <= datetime.now(),
            Suspension.end_date >= datetime.now()
        ).first()

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
    db_user = db.query(User).filter(User.email == user['email']).first()
    return db_user

@router.post("/suspend-account")
def suspend_account(request: Request, 
                    suspend_user: suspendUserRequest, 
                    db: Session = Depends(get_db),
                    _: dict = Depends(LoginRequired(roles_required={TypeOfUser.ADMIN}))):
    #check if email is already suspended
    db_user = db.query(Suspension).filter(Suspension.user_email == suspend_user.email).first()
    if db_user != None:
        raise HTTPException(status_code=400, detail="Email already suspended")
    db_suspended_user = Suspension(
        user_email=suspend_user.email,
        start_date=datetime.now(),
        end_date=suspend_user.end_date,
        reason=suspend_user.reason
    )
    db.add(db_suspended_user)
    db.commit()
    return session_mgr.logout_user(request)