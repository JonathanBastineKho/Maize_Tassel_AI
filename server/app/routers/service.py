from fastapi import APIRouter, UploadFile, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import event, inspect
from typing import Optional
import asyncio
from app.utils import storage_mgr
from app.database.schema import Folder, TypeOfUser, Image, Prediction, TypeOfImageStatus
from app.database.utils import get_db
from app.utils.payload import LoginRequired, FolderPayload, ImagePayload
from app.utils.sockets import sio_server
from app.utils import job_mgr, session_mgr

router = APIRouter(tags=["Regular Service"], prefix="/service")


@router.post("/count")
async def count(file: UploadFile, folder_uuid: str = Form(...),  # Change to UUID type in production
                name: str = Form(...), description: Optional[str] = Form(None),
                user: dict = Depends(LoginRequired(
                    roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM})),
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
        job_mgr.submit_inference_job(
            email=user["email"], folder_id=folder_uuid, image_name=name, path=metadata['image_path'])
        thumbnail_url = await storage_mgr.get_image(new_img.thumbnail_url)
        return {"Success": True,
                "name": name, "size": round(new_img.size / (1024 * 1024), 2), "thumbnail_url": thumbnail_url[0], "upload_date": new_img.upload_date}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail="Some error occured, please retry")


@router.post("/bulk-count")
async def bulk_count():
    return


@router.get("/search-item")
async def search_item(folder_id: Optional[str] = None, db: Session = Depends(get_db), user: dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM}))):
    # if folder_id is none, then its the parent
    if not folder_id:
        folder_id = db.query(Folder).filter(
            Folder.user_email == user['email'], Folder.parent_id == None).one_or_none().id

    folders = [{"name": folder.name, "create_date": folder.create_date} for folder in db.query(
        Folder).filter(Folder.parent_id == folder_id, Folder.user_email == user['email']).all()]
    images = db.query(Image).filter(Image.folder_id == folder_id).all()
    image_urls = await storage_mgr.get_image([image.thumbnail_url for image in images])

    image_data = {
        image.name: {
            "size": round(image.size / (1024 * 1024), 2),
            "status": image.processing_status,
            "upload_date": image.upload_date.strftime('%Y-%m-%dT%H:%M:%S%z'),
            "thumbnail_url": url
        }
        for image, url in zip(images, image_urls)
    }

    return {
        "Success": True,
        "folders": folders,
        "images": image_data
    }


@router.get("/view-image")
async def view_image(img_name: str, folder_id: Optional[str] = None, db: Session = Depends(get_db), user: dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM}))):
    image_data = {}
    # Check if folder ID belongs to the user
    if not folder_id:
        fldr = db.query(Folder).filter(Folder.user_email == user['email'], Folder.parent_id == None).one_or_none()
        folder_id = fldr.id
    if not fldr and not db.query(Folder).filter(Folder.id == folder_id, Folder.user_email == user["email"]).one_or_none():
        raise HTTPException(401, detail="Invalid Image")

    # Get image URL
    img = db.query(Image).filter(Image.name == img_name,
                                 Image.folder_id == folder_id).one_or_none()
    if not img:
        raise HTTPException(400, detail="Invalid image")
    image_data['name'] = img.name
    image_data['description'] = img.description
    image_data['size'] = round(img.size / (1024*1024), 2)
    image_data['width'] = img.width
    image_data['height'] = img.height
    image_data['status'] = img.processing_status
    image_data['upload_date'] = img.upload_date
    if img.finish_date and img.upload_date:
        processing_time = img.finish_date - img.upload_date
        hours, remainder = divmod(processing_time.seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        if hours > 0:
            image_data['processing_time'] = f"{hours} hr{'s' if hours > 1 else ''}, {minutes} min{'s' if minutes > 1 else ''}"
        elif minutes > 0:
            image_data['processing_time'] = f"{minutes} min{'s' if minutes > 1 else ''}, {seconds} sec{'s' if seconds > 1 else ''}"
        else:
            image_data['processing_time'] = f"{seconds} second{'s' if seconds > 1 else ''}"
    else:
        image_data['processing_time'] = "N/A"
    url = await storage_mgr.get_image([img.image_url, img.thumbnail_url])
    image_data['thumbnail_url'] = url[1]
    image_data['url'] = url[0]
    if img.processing_status == TypeOfImageStatus.DONE:
        # Get Image predictions
        image_data['prediction'] = [
            {
                "xCenter" : box.xCenter,
                "yCenter" : box.yCenter,
                "width" : box.width,
                "height" : box.height,
                "confidence" : box.confidence
            }
            for box in
            db.query(Prediction).filter(Prediction.folder_id ==
                                        folder_id, Prediction.image_name == img_name).all()
        ]

    return image_data

@router.delete("/delete-image")
async def delete_image(image: ImagePayload, db: Session = Depends(get_db), user: dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM}))):
    # Folder is parent folder
    if not image.folder_id:
        fldr = db.query(Folder).filter(Folder.user_email == user['email'], Folder.parent_id == None).one_or_none()
        image.folder_id = fldr.id

    img = db.query(Image).filter(Image.folder_id == image.folder_id, Image.name == image.name).one_or_none()
    if not img:
        raise HTTPException(400, detail="Invalid image")
    
    # Check if user owned that image
    if not fldr and not db.query(Folder).filter(Folder.id == image.folder_id, Folder.user_email == user["email"]).one_or_none():
        raise HTTPException(401, detail="Invalid Image")
    
    # deleting the image
    try:
        await storage_mgr.delete_image(img.image_url)
        db.delete(img)
        db.commit()
    except Exception as e:
        print(e)
        db.rollback()
        raise HTTPException(500, detail="An error occurred while deleting the image")
    return {"Success" : True}

@router.get("/parent-folders")
async def get_parent_folders(folder_id: Optional[str] = None, db: Session = Depends(get_db), user: dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM}))):
    parent_folders = []

    # return only parent folder
    if folder_id == None:
        folder = db.query(Folder).filter(
            Folder.user_email == user['email'], Folder.parent_id == None).one_or_none()
        parent_folders.append({"name": folder.name, "id": folder.id})
        return {"Success": True, "parent_folders": parent_folders}

    curr_folder = db.query(Folder).filter(Folder.id == folder_id).one_or_none()

    # Check for current folder
    if curr_folder == None:
        raise HTTPException(status_code=400, detail="Folder invalid")

    # Recursive search
    while curr_folder.parent_id != None:
        parent = db.query(Folder).filter(
            Folder.id == curr_folder.parent_id).one_or_none()
        parent_folders.append({"name": parent.name, "id": parent.id})
        curr_folder = parent
    parent_folders.append({"name": curr_folder.name, "id": curr_folder.id})

    return {"Success": True, "parent_folders": parent_folders.reverse()}


@router.post("/create-folder")
async def create_folder():
    return


@router.delete("/delete-folder")
async def delete_folder(folder: FolderPayload):
    return

@event.listens_for(Image, 'after_update')
def receive_after_update(mapper, connection, target):
    state = inspect(target)
    history = state.get_history('processing_status', True)

    if history.has_changes():
        new_status = history.added[0]
        owner = target.folder.user_email

        # Emit the status change to the user
        session_ids = session_mgr.connections.get(owner)
        if session_ids:
            for session_id in session_ids:
                asyncio.create_task(sio_server.emit('image_status_update', {
                    'name': target.name,
                    'status': new_status
                }, room=session_id))
