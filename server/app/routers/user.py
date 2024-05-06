from fastapi import APIRouter, UploadFile, Form, Depends, HTTPException
from sqlalchemy.orm import Session
import os
from app.utils import storage_mgr
from app.database.schema import Folder, TypeOfUser, Image
from app.database.utils import get_db
from app.utils.payload import LoginRequired

router = APIRouter(tags=["User"], prefix="/user")

@router.post("/count")
async def count(file: UploadFile, folder_uuid: str = Form(...),  # Change to UUID type in production
                user:dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM})),
                db: Session = Depends(get_db)):
    
    # Check if image is valid
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in set({".jpg", ".jpeg", ".png"}):
        raise HTTPException(status_code=400, detail="Image must be jpg or png")
    
    try:
        # Check if folder is valid
        folder = db.query(Folder).filter(Folder.id == folder_uuid).one_or_none()
        if not folder:
            raise HTTPException(status_code=400, detail="Folder does not exist")

        # Check if there is a same name in the folder
        if db.query(Image).filter(Image.folder_id == folder.id, Image.name == file.filename).one_or_none():
            raise HTTPException(status_code=409, detail="An image with the same name already exists in this folder.")
        
        metadata = await storage_mgr.upload_image(file, email=user["email"], folder=folder.id)
        # Add image to database
        db.add(
            Image(
                name=file.filename,
                folder_id=folder_uuid,
                size=metadata["size"],
                width=metadata["width"],
                height=metadata["height"],
                image_url=metadata["image_path"],
                thumbnail_url=metadata["thumbnail_path"]
            )
        )
        db.commit()
        return {"Success" : True}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Some error occured, please retry")


@router.post("/bulk-count")
async def bulk_count():
    return

@router.get("/view-image")
async def view_image():
    return