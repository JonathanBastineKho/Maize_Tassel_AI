from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timezone
from app.utils.payload import LoginRequired, suspendUserRequest, ViewUserAccountRequest
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

@router.get("/view-account/{email}")
def viewAccount(email: str, user: dict = Depends(LoginRequired(roles_required={TypeOfUser.ADMIN})), db: Session = Depends(get_db)):
    db_user = User.retrieve(db, email=email)
 
    data = {
        "email": db_user.email,
        "name": db_user.name,
        "phone": db_user.phone,
        "country": db_user.country,
        "profile_pict" : db_user.profile_pict,
        "verified": db_user.verified,
        "role": db_user.role,
    }
    
    user_suspension = Suspension.retrieve_user_suspension(db=db, email=email)
    user_transactions = Transaction.retrieve(db, user_email=user['email'])
    
    user_transaction = {}
    user_transaction["transactions"] = [{"start_date" : tr.start_date, "end_date" : tr.end_date, "amount" : tr.amount, "status" : tr.success} for tr in user_transactions]
    
    last_transaction = user_transaction[0] if user_transactions else None
    user_transaction["cancelled"] = last_transaction is not None and not last_transaction.auto_renew
    
    return {"user": data, "suspension": user_suspension, 'transaction' : user_transaction}

@router.post("/suspend-account")
def suspend_account(request: Request, 
                    suspend_user: suspendUserRequest, 
                    db: Session = Depends(get_db),
                    _: dict = Depends(LoginRequired(roles_required={TypeOfUser.ADMIN}))):
    #check if email is already suspended
    try:
        Suspension.create(db, user_email=suspend_user.email,
        start_date=datetime.now(timezone.utc),
        end_date=datetime.now(timezone.utc) + suspend_user.duration,
        reason=suspend_user.reason)
    except IntegrityError:
        raise HTTPException(400, detail="User already suspended")
    
    return session_mgr.logout_user(request)