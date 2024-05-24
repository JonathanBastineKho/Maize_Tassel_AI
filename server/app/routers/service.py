from fastapi import APIRouter, UploadFile, Form, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import event, inspect
from typing import Optional
from io import BytesIO
from PIL import ImageDraw, ImageFont
from PIL import Image as PILImage
import asyncio, os
import zipfile
from app.utils import storage_mgr
from app.database.schema import Folder, TypeOfUser, Image, Prediction, TypeOfImageStatus
from app.database.utils import get_db
from app.utils.payload import LoginRequired, FolderPayload, ImagePayload, CreateFolderBody
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
async def search_item(
    folder_id: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    user: dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM}))
):
    # if folder_id is none, then its the parent
    if not folder_id:
        folder_id = db.query(Folder).filter(
            Folder.user_email == user['email'],
            Folder.parent_id == None
        ).one_or_none().id

    offset = (page - 1) * page_size

    folder_query = db.query(Folder).filter(
        Folder.parent_id == folder_id,
        Folder.user_email == user['email']
    )

    image_query = db.query(Image).filter(Image.folder_id == folder_id)
    if search:
        search_term = f"%{search}%"
        folder_query = folder_query.filter(Folder.name.ilike(search_term))
        image_query = image_query.filter(Image.name.ilike(search_term))

    folders = [
        {"name": folder.name, "create_date": folder.create_date}
        for folder in folder_query.offset(offset).limit(page_size).all()
    ]

    remaining_limit = page_size - len(folders)
    if remaining_limit > 0:
        images = image_query.offset(offset + len(folders)).limit(remaining_limit).all()
        image_urls = await storage_mgr.get_image([image.thumbnail_url for image in images])
        image_data = [
            [image.name, {
                "size": round(image.size / (1024 * 1024), 2),
                "status": image.processing_status,
                "upload_date": image.upload_date.strftime('%Y-%m-%dT%H:%M:%S%z'),
                "thumbnail_url": url
            }]
            for image, url in zip(images, image_urls)
        ]
    else:
        image_data = []

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
async def delete_folder(folder: FolderPayload):
    return

@router.get("/download-image")
def download_image(
    img_name: str,
    folder_id: str = None,
    draw_boxes: bool = True,
    box_color: str = "#FF0000",  # Default color is red
    show_confidence: bool = False,
    db: Session = Depends(get_db),
    user: dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM}))
):
    if not folder_id:
        folder = db.query(Folder).filter(Folder.parent_id == None, Folder.user_email == user['email']).one_or_none()
    else:
        folder = db.query(Folder).filter(Folder.id == folder_id, Folder.user_email == user['email']).one_or_none()
    if not folder:
        raise HTTPException(status_code=400, detail="Folder does not exist")

    image = db.query(Image).filter(Image.folder_id == folder.id, Image.name == img_name).one_or_none()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    async def download_and_process_image():
        if image.processing_status == TypeOfImageStatus.DONE:
            image_data = await storage_mgr.download_image(path=image.image_url)
            predictions = db.query(Prediction).filter(Prediction.folder_id == folder.id, Prediction.image_name == img_name).all()
            
            if draw_boxes:
                # Open the image using PIL
                pil_image = PILImage.open(BytesIO(image_data))
                draw = ImageDraw.Draw(pil_image)
                font = ImageFont.load_default(size=26)

                # Parse the box color from hexadecimal string
                box_color_rgb = tuple(int(box_color[i:i+2], 16) for i in (1, 3, 5))

                for prediction in predictions:
                    x1 = prediction.xCenter - prediction.width / 2
                    y1 = prediction.yCenter - prediction.height / 2
                    x2 = prediction.xCenter + prediction.width / 2
                    y2 = prediction.yCenter + prediction.height / 2

                    # Draw the bounding box
                    draw.rectangle([(x1, y1), (x2, y2)], outline=box_color_rgb, width=5)

                    if show_confidence:
                        confidence_text = f"{prediction.confidence:.2f}"
                        position = (x1, y1 - 20)

                        bbox = draw.textbbox(position, confidence_text, font=font)
                        draw.rectangle(bbox, fill=(0, 0, 0, 128))
                        draw.text(position, confidence_text, font=font, fill=(255, 255, 255))

                # Save the modified image to a BytesIO object
                modified_image_buffer = BytesIO()
                pil_image.save(modified_image_buffer, format="JPEG")
                modified_image_buffer.seek(0)
                image_data = modified_image_buffer.getvalue()

            zip_buffer = BytesIO()
            try:
                with zipfile.ZipFile(zip_buffer, "w") as zip_file:
                    # Add the image to the zip file
                    zip_file.writestr(os.path.basename(image.image_url), image_data)

                    # Create a text file with prediction information
                    prediction_info = f"Total Boxes: {len(predictions)}\n\n"
                    for prediction in predictions:
                        prediction_info += f"Box ID: {prediction.box_id}\n"
                        prediction_info += f"Coordinates: ({prediction.xCenter}, {prediction.yCenter})\n"
                        prediction_info += f"Width: {prediction.width}\n"
                        prediction_info += f"Height: {prediction.height}\n"
                        prediction_info += f"Confidence: {prediction.confidence}\n\n"
                    zip_file.writestr("predictions.txt", prediction_info.encode('utf-8'))

                # Set the file pointer to the beginning of the zip file
                zip_buffer.seek(0)
                return Response(zip_buffer.getvalue(), media_type="application/zip", headers={
                    "Content-Disposition": f"attachment;filename={img_name}.zip",
                    "Content-Length": str(len(zip_buffer.getvalue())),
                    "X-Total-Size": str(len(zip_buffer.getvalue()))
                })
            except:
                raise HTTPException(detail='There was an error processing the data', status_code=400)
        else:
            # If it's only images, sign the URL and let the client download from CDN (offloading load)
            url = await storage_mgr.get_image(image.image_url)
            return {"url": url[0]}

    return asyncio.run(download_and_process_image())

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
