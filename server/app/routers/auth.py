from fastapi import APIRouter, Depends, HTTPException, Request
from app.database.schema import User, Folder, Suspension
from app.utils.payload import UserCreateRequest, UserRequest, LoginRequired, UserLoginRequest, ResetPasswordRequest, googleAuth
from app.database.utils import get_db
from datetime import datetime, timezone
from app.utils import session_mgr
from app.utils import email_sender
from config import Config
from sqlalchemy.orm import Session
from bcrypt import hashpw, gensalt, checkpw
import requests
import re

router = APIRouter(tags=["auth"], prefix="/auth")

@router.get("/")
async def test():
    return {"Success" : True}

@router.post("/register")
async def register(user : UserCreateRequest, request: Request, db: Session = Depends(get_db)):

    # Checking input
    email_regex = r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'
    if not user.email or not re.match(email_regex, user.email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    if len(user.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
    
    # Check if email already exists
    db_user = User.retrieve(db, email=user.email)
    if db_user != None:
        if db_user.password != None:
            raise HTTPException(status_code=400, detail="Email already registered")
        elif db_user.password == None:
            raise HTTPException(status_code=400, detail="Email already registered with Google")
    # Adding new user
    password_hash = hashpw(user.password.encode('utf-8'), gensalt())
    db_user = User.create(db, email=user.email, name=user.name, password=password_hash)

    # Adding default root folder for new user
    Folder.create(db, name="Home", user_email=user.email)

    # Generating confirmation token
    await email_sender.send_confirm_email(user.email)
    return session_mgr.login_user(email=user.email,
                                  name=user.name,
                                  role=db_user.role, 
                                  verified=db_user.verified, 
                                  request=request)

@router.post("/login")
async def login(user : UserLoginRequest, request:Request, db: Session = Depends(get_db)):
    # Check if user exist
    db_user = User.retrieve(db, email=user.email)
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if db_user.password == None:
        raise HTTPException(status_code=409, detail="Email is registered using Google")

    # Check if password match
    if not checkpw(user.password.encode("utf-8"), db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if user is suspended
    suspension = Suspension.retrieve(db, email=user.email, date=datetime.now(timezone.utc))
    if suspension:
        raise HTTPException(status_code=401, detail="You are suspended")
    
    return session_mgr.login_user(email=user.email, 
                                  name=db_user.name,
                                  role=db_user.role, 
                                  verified=db_user.verified, 
                                  request=request,
                                  profile_pict=db_user.profile_pict)

@router.post("/google-login")
async def google_login(request:Request, token:googleAuth, db: Session = Depends(get_db)):
    data = {
        'code' : token.auth_code,
        'client_id' : Config.GOOGLE_CLIENT_ID,
        'client_secret' : Config.GOOGLE_CLIENT_SECRET,
        'redirect_uri' : 'postmessage',
        'grant_type' : 'authorization_code'
    }
    response = requests.post('https://oauth2.googleapis.com/token', data=data)
    if not response.ok:
        raise HTTPException(status_code=401, detail="Invalid request")
    headers = {
        'Authorization': f'Bearer {response.json()["access_token"]}'
    }
    user = requests.get('https://www.googleapis.com/oauth2/v3/userinfo', headers=headers).json()

    db_user = User.retrieve(db, email=user['email'])
    if db_user != None and db_user.password != None:
        raise HTTPException(status_code=400, detail="Email is already registered without google")
    # If user hasn't been registered
    if db_user == None:
        db_user = User.create(db, email=user["email"], name=user["name"], verified=True, profile_pict=user["picture"])
        Folder.create(db, name="Home", user_email=user["email"])
    
    return session_mgr.login_user(email=user["email"], 
                                  name=user["name"],
                                  role=db_user.role, 
                                  verified=db_user.verified, 
                                  request=request,
                                  profile_pict=db_user.profile_pict)
    
@router.post("/logout")
async def logout(request: Request, user:dict = Depends(LoginRequired(verified=False))):
    return session_mgr.logout_user(request)

@router.patch("/confirm/{token}")
async def verify_email(token: str,
                       request: Request,
                       db: Session = Depends(get_db), 
                       user:dict = Depends(LoginRequired(verified=False))):
    # Check if token valid
    valid_token = email_sender.check_token(token, "email", 7200)

    # verify user
    db_user = User.update(db, email=valid_token["email"], verified=True)
    session_mgr.logout_user(request)
    return session_mgr.login_user(db_user.email, name=db_user.name, verified=True, role=db_user.role, request=request)

@router.post("/request-verification")
async def request_verification(user:dict = Depends(LoginRequired(verified=False))):
    await email_sender.send_confirm_email(user["email"])
    return {"Success" : True}

@router.post("/reset-password/request")
async def request_reset_password(user: UserRequest, db: Session = Depends(get_db)):
    db_user = User.retrieve(db, email=user.email)
    if db_user == None or db_user.password == None:
        raise HTTPException(status_code=401, detail="Email is not valid")
    sent_token = await email_sender.send_reset_password(user.email)
    session_mgr.r.set(sent_token, user.email)
    return {"Success" : True}

@router.get("/reset-password/check/{token}")
async def check_reset_password(token:str, request:Request):
    session_mgr.check_if_already_logged_in(request)
    email_sender.check_token(token, "reset_password", 900)
    if not session_mgr.r.exists(token):
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    return {"Success" : True}

@router.patch("/reset-password/confirm/{token}")
async def confirm_reset_password(token:str, new_password:ResetPasswordRequest, request:Request, db: Session = Depends(get_db)):
    # Check for password
    if len(new_password.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
    
    session_mgr.check_if_already_logged_in(request)
    valid_token = email_sender.check_token(token, "reset_password", 900)

    # Update the user
    hashed_password = hashpw(new_password.password.encode('utf-8'), gensalt())
    User.update(db, email=valid_token["email"], password=hashed_password)

    session_mgr.r.delete(token)
    return {"Success" : True}

@router.get("/whoami")
async def whomai(user:dict = Depends(LoginRequired(verified=False))):
    return user