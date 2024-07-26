from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from fastapi.responses import StreamingResponse
from app.utils import llm_mgr
from app.utils.payload import LoginRequired
from app.database.schema import TypeOfUser, Chat
from sqlalchemy.orm import Session
from app.database.utils import get_db

router = APIRouter(tags=["AI"], prefix="/ai")

@router.post("/chat-disease")
async def chat_disease(
    text: str = Form(...),
    image: UploadFile = File(None),
    chat_history: str = Form(None),
    user: dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM})),
    db: Session = Depends(get_db)
):
    # Check if quota already maxed out
    if user['role'] == TypeOfUser.REGULAR:
        chat = Chat.retrieve(db, user['email'])
        count = 0 if chat is None else chat.count
        if count >= 5:
            raise HTTPException(429, detail="Your quota for the day is full")
    
    Chat.add(db, user['email'])
    image_data = None
    image_mime_type = None
    if image:
        image_data = await image.read()
        image_mime_type = image.content_type
    async def generate():
        try:
            async for chunk in llm_mgr.chat_disease(text, image_data, image_mime_type, chat_history):
                yield f"{chunk}"
        except Exception as e:
            error_message = f"Error: {str(e)}"
            raise HTTPException(500, detail=error_message)

    return StreamingResponse(generate(), media_type="text/event-stream")

@router.get("/search-youtube")
def search_youtube(search: str):
    return {
        "youtube" : llm_mgr.search_youtube(keyword=search)
    }

@router.get("/get-quota")
def get_quota(db: Session = Depends(get_db), user: dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM}))):
    chat = Chat.retrieve(db, user['email'])
    return {
        "count": 0 if chat is None else chat.count
    }