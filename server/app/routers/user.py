from fastapi import APIRouter, Depends, HTTPException
import stripe
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timezone, timedelta
from app.utils.payload import LoginRequired, suspendUserRequest
from app.database.schema import TypeOfUser, User, Suspension, Transaction
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
def viewAccount(email: str, user: dict = Depends(LoginRequired(roles_required={TypeOfUser.ADMIN})), db: Session = Depends(get_db)):
    db_user = User.retrieve(db, email=email)
    if db_user == None:
        raise HTTPException(400, detail="User not found")
    data = {
        "email": db_user.email,
        "name": db_user.name,
        "phone": db_user.phone,
        "country": db_user.country,
        "profile_pict" : db_user.profile_pict,
        "verified": db_user.verified or db_user.password == None,
        "role": db_user.role,
    }
    
    user_suspension = Suspension.retrieve_user_suspension(db=db, email=email)
    trx = Transaction.retrieve_latest(db, user_email=email)
    return {"user": data, 
            "suspension": user_suspension,
            "suspended" : len(Suspension.retrieve(db, email=email, date=datetime.now())) > 0,
            "next_date" : None if not trx else trx.end_date, 
            "cancelled" : None if not trx else not trx.auto_renew}

@router.post("/suspend-account")
def suspend_account(
                    suspend_user: suspendUserRequest, 
                    db: Session = Depends(get_db),
                    _: dict = Depends(LoginRequired(roles_required={TypeOfUser.ADMIN}))):
    #check if email is already suspended
    if len(Suspension.retrieve(db, email=suspend_user.email, date=datetime.now())) > 0:
        raise HTTPException(400, detail="User already suspended")
    try:
        Suspension.create(db, user_email=suspend_user.email,
        start_date=datetime.now(timezone.utc),
        end_date=datetime.now(timezone.utc) + timedelta(days=suspend_user.duration),
        category=suspend_user.category,
        reason=suspend_user.reason)
    except IntegrityError:
        raise HTTPException(400, detail="User already suspended")
    
    trx = Transaction.retrieve_latest(db, user_email=suspend_user.email)
    if trx and trx.auto_renew:
        stripe.Subscription.modify(
            trx.transaction_id,
            cancel_at_period_end=True
        )
    session_mgr.revoke_user(email=suspend_user.email)
    return {"Success" : True}