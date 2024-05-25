from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime
from app.utils.payload import LoginRequired, SuspendAccountRequest
from app.database.schema import TypeOfUser, User, Suspension
from app.database.utils import get_db

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
async def suspend_account(suspend_account_request: SuspendAccountRequest, user:dict = Depends(LoginRequired(roles_required={TypeOfUser.ADMIN})), db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == suspend_account_request.email).first()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_suspension = db.query(Suspension).filter(Suspension.user_email == suspend_account_request.email).first()
    if db_suspension:
        raise HTTPException(status_code=400, detail="User is already suspended")
    
    start_date = datetime.date.today()
    end_date = start_date + datetime.timedelta(days=suspend_account_request.duration)
    # add reason, and details 
    new_suspension = Suspension(user_email=suspend_account_request.email, start_date=start_date, end_date=end_date, suspension=suspend_account_request.reason)

    db.add(new_suspension)
    db.commit()
    
    return {"Success" : True}

