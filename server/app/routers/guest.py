from fastapi import APIRouter, Depends, HTTPException, Request
from app.database.schema import User, UserType
from app.request.user import UserCreateRequest
from app.database.utils import get_db
from app.database import session_mgr
from sqlalchemy.orm import Session
from bcrypt import hashpw, gensalt, checkpw

router = APIRouter(tags=["Guest"], prefix="/api")

@router.get("/test")
async def test():
    return {"Success" : True}

@router.post("/register")
async def register(user : UserCreateRequest, db: Session = Depends(get_db)):
    # Check if email already exists
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Adding new user
    password_hash = hashpw(user.password.encode('utf-8'), gensalt())
    db_user = User(email=user.email, password=password_hash, userType = UserType.REGULAR)
    db.add(db_user)
    db.commit()

@router.post("/login")
async def login(user : UserCreateRequest, request:Request, db: Session = Depends(get_db)):
    # Check if user exist
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if password match
    if not checkpw(user.password.encode("utf-8"), db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return session_mgr.login_user(user.email, request)