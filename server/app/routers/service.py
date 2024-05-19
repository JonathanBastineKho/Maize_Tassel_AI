from fastapi import APIRouter, UploadFile, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import event, inspect
from typing import Optional
import asyncio
from app.utils import storage_mgr
from app.database.schema import Folder, TypeOfUser, Image
from app.database.utils import get_db
from app.utils.payload import LoginRequired
from app.utils.sockets import sio_server
from app.utils import job_mgr, session_mgr
from pydantic import BaseModel

router = APIRouter(tags=["Regular Service"], prefix="/service")

@router.post("/count")
async def count(file: UploadFile, folder_uuid: str = Form(...),  # Change to UUID type in production
                name: str = Form(...), description: Optional[str] = Form(None),
                user:dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM})),
                db: Session = Depends(get_db)):
    metadata = await storage_mgr.upload_image(file, name, email=user["email"], folder_name=folder_uuid, db=db)
    try:
        # Add image to database
        new_img = Image(
                name=name,
                description=description,
                folder_id=folder_uuid,
                size=metadata["size"],
                width=metadata["width"],
                height=metadata["height"],
                image_url=metadata["image_path"],
                thumbnail_url=metadata["thumbnail_path"]
            )
        db.add(new_img)
        db.commit()
        # Submit job
        job_mgr.submit_inference_job(email=user["email"], folder_id=folder_uuid, image_name=name, path=metadata['image_path'])

        return {"Success" : True, "name" : name, "size" : round(new_img.size / (1024 * 1024), 2), "upload_date" : new_img.upload_date}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Some error occured, please retry")

@router.post("/bulk-count")
async def bulk_count():
    return

@router.get("/parent-folders")
async def get_parent_folders(folder_id: Optional[str] = None, db: Session = Depends(get_db), user:dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM}))):
    parent_folders = []

    # return only parent folder
    if folder_id == None:
        folder = db.query(Folder).filter(Folder.user_email == user['email'] and Folder.parent_id == None).one_or_none()
        parent_folders.append({"name" : folder.name, "id" : folder.id})
        return {"Success" : True, "parent_folders" : parent_folders}

    curr_folder = db.query(Folder).filter(Folder.id == folder_id).one_or_none()

    # Check for current folder
    if curr_folder == None:
        raise HTTPException(status_code=400, detail="Folder invalid")

    # Recursive search
    while curr_folder.parent_id != None:
        parent = db.query(Folder).filter(Folder.id == curr_folder.parent_id).one_or_none()
        parent_folders.append({"name" : parent.name, "id" : parent.id})
        curr_folder = parent
    parent_folders.append({"name" : curr_folder.name, "id" : curr_folder.id})

    return {"Success" : True, "parent_folders" : parent_folders.reverse()}

@router.get("/search-item")
async def search_item(folder_id: Optional[str] = None, db: Session = Depends(get_db), user:dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM}))):
    # if folder_id is none, then its the parent
    if not folder_id:
        folder_id = db.query(Folder).filter(Folder.user_email == user['email'] and Folder.parent_id == None).one_or_none().id
    
    folders = [ {"name" : folder.name, "create_date" : folder.create_date} for folder in db.query(Folder).filter(Folder.parent_id == folder_id and Folder.user_email == user['email']).all()]
    images = {image.name : 
              {"size" : round(image.size / (1024 * 1024), 2), 
               "status" : image.processing_status, 
               "upload_date" : image.upload_date.strftime('%Y-%m-%dT%H:%M:%S%z')} 
               for image in db.query(Image).filter(Image.folder_id == folder_id).all()}
    return {
        "Success" : True,
        "folders" : folders,
        "images" : images
    }
    
class CreateFolderBody(BaseModel):
    folder_name : str
    parent_id : Optional[str] = None
    
@router.post("/create-folder")
async def create_folder(folder: CreateFolderBody, db: Session = Depends(get_db), user:dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM}))):
    new_Folder = Folder(
        name = folder.folder_name,
        parent_id = folder.parent_id,
        user_email = user['email']
    )
    db.add(new_Folder)
    db.commit()
    return {"Success" : True}

@router.delete("/delete-folder")
async def delete_folder():
    return

@router.get("/view-image")
async def view_image():
    return

@router.post("/test")
async def test_change(db: Session = Depends(get_db)):
    img = db.query(Image).filter(Image.name == 'XAM05_YM_20150802160229_01.jpg').one_or_none()
    img.processing_status = "processing"
    db.commit()

@event.listens_for(Image, 'after_update')
def receive_after_update(mapper, connection, target):
    state = inspect(target)
    history = state.get_history('processing_status', True)

    if history.has_changes():
        new_status = history.added[0]
        owner = target.folder.user_email

        # Emit the status change to the user
        session_id = session_mgr.connections.get(owner)
        if session_id:
            asyncio.create_task(sio_server.emit('image_status_update', {
                'name': target.name,
                'status': new_status
            }, room=session_id))