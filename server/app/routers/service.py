from fastapi import APIRouter, UploadFile, Form, Depends, HTTPException, BackgroundTasks
from fastapi.responses import Response
from fastapi.concurrency import run_in_threadpool
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import event, inspect
from typing import Optional, List, Tuple
from io import BytesIO
from PIL import ImageDraw, ImageFont
from PIL import Image as PILImage
import asyncio, os, re
import zipfile
import requests
import json
from app import Config
from app.utils import storage_mgr
from app.database.schema import Folder, TypeOfUser, Image, Prediction, TypeOfImageStatus
from app.database.utils import get_db
from app.utils.payload import LoginRequired, FolderPayload, ImagePayload, CreateFolderBody, ImageFeedback, RenameFolderBody, RenameImageBody
from app.utils.sockets import sio_server
from app.utils import job_mgr, session_mgr
from math import isfinite

router = APIRouter(tags=["Regular Service"], prefix="/service")

def sanitize_filename(filename: str) -> Tuple[str, bool]:
    original_name, ext = os.path.splitext(filename)
    
    # Check for potential directory traversal
    is_malicious = '..' in original_name or '/' in original_name or '\\' in original_name
    
    # Remove any directory component
    name = os.path.basename(original_name)
    
    # Define allowed special characters
    allowed_special_chars = r'!@#$%^&*()_+-=[]{}|;:,.<>? '
    
    # Check for disallowed characters
    if re.search(f'[^\\w{re.escape(allowed_special_chars)}]', name):
        is_malicious = True
    
    # Replace disallowed characters with underscores
    name = re.sub(f'[^\\w{re.escape(allowed_special_chars)}]', '_', name)
    
    # Remove any leading or trailing spaces and underscores
    name = name.strip(' _')
    
    # Ensure the extension is lowercase and starts with a dot
    ext = ext.lower()
    if ext and not ext.startswith('.'):
        ext = '.' + ext
    
    # Limit the length of the name (e.g., to 255 characters minus the length of the extension)
    max_length = 255 - len(ext)
    if len(name) > max_length:
        name = name[:max_length]
        is_malicious = True
    
    # Combine the sanitized name and extension
    sanitized_filename = name + ext
    
    # Check if the sanitization process changed the filename
    if sanitized_filename != filename:
        is_malicious = True
    
    return sanitized_filename, is_malicious

@router.post("/count")
async def count(file: UploadFile, folder_uuid: str = Form(None),  # Change to UUID type in production
                name: str = Form(...), description: Optional[str] = Form(None),
                user: dict = Depends(LoginRequired(
                    roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM})),
                db: Session = Depends(get_db)):
    if not folder_uuid:
        folder_uuid = Folder.retrieve_root(db, user['email']).id
    if user['role'] == TypeOfUser.REGULAR and Image.count(db, email=user['email']) >= 100:
        raise HTTPException(429, detail="Your storage is full")
    
    name, is_malicious = sanitize_filename(name)
    if is_malicious:
        raise HTTPException(400, detail="Name is not valid")

    metadata = await storage_mgr.upload_image(file, name, email=user["email"], folder_name=folder_uuid, db=db)
    try:
        # Add image to database
        new_img = Image.create(db=db, name=name,
            description=description,
            folder_id=folder_uuid,
            size=metadata["size"],
            width=metadata["width"],
            height=metadata["height"],
            image_url=metadata["image_path"],
            thumbnail_url=metadata["thumbnail_path"])
        # Submit job
        priority = 0 if user['role'] == TypeOfUser.REGULAR else 5
        job_mgr.submit_inference_job(
            email=user["email"], folder_id=folder_uuid, image_name=name, path=metadata['image_path'], priority=priority)
        thumbnail_url = await storage_mgr.get_image(new_img.thumbnail_url)
        return {"Success": True,
                "name": name, "size": round(new_img.size / (1024 * 1024), 2), 
                "thumbnail_url": thumbnail_url[0], 
                "upload_date": new_img.upload_date}
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=500, detail="Some error occured, please retry")

def process_zip_file(file: UploadFile, folder_uuid: str, user: dict, db: Session):
    # Extract zip file and process each image
    zip_results = []
    with zipfile.ZipFile(BytesIO(file.file.read()), 'r') as zip_ref:
        for zip_info in zip_ref.infolist():
            if not zip_info.is_dir() and zip_info.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                with zip_ref.open(zip_info) as image_file:
                    image_bytes = image_file.read()
                    image_file = UploadFile(filename=zip_info.filename, file=BytesIO(image_bytes))
                    metadata = asyncio.run(storage_mgr.upload_image(image_file, zip_info.filename, email=user["email"], folder_name=folder_uuid, db=db))
                    try:
                        # Add image to database
                        Image.create(
                            db=db,
                            name=zip_info.filename,
                            folder_id=folder_uuid,
                            size=metadata["size"],
                            width=metadata["width"],
                            height=metadata["height"],
                            image_url=metadata["image_path"],
                            thumbnail_url=metadata["thumbnail_path"]
                        )
                        zip_results.append({
                            "name": zip_info.filename,
                            "path": metadata['image_path']
                        })
                    except Exception as e:
                        pass
    return zip_results

def upload_images_background(files: List[UploadFile], folder_uuid: str, user: dict, db: Session):
    images = []
    for file in files:
        if file.filename.endswith('.zip'):
            # Handle zip files
            zip_images = process_zip_file(file, folder_uuid, user, db)
            images.extend(zip_images)
        else:
            # Handle individual image file
            try:
                metadata = asyncio.run(storage_mgr.upload_image(file, file.filename, email=user["email"], folder_name=folder_uuid, db=db))
                Image.create(
                    db=db,
                    name=file.filename,
                    folder_id=folder_uuid,
                    size=metadata["size"],
                    width=metadata["width"],
                    height=metadata["height"],
                    image_url=metadata["image_path"],
                    thumbnail_url=metadata["thumbnail_path"]
                )
                images.append({
                    "name": file.filename,
                    "path": metadata['image_path']
                })
            except Exception as e:
                # Will not create the image
                pass

    # Submitting jobs
    job_id = session_mgr.store_job_data(len(images))
    try:
        for img in images:
            job_mgr.submit_inference_job(
                email=user['email'],
                folder_id=folder_uuid,
                image_name=img['name'],
                path=img['path'],
                job_id=job_id,
                priority=5
            )
    except Exception as e:
        raise HTTPException(500, detail=str(e))

@router.post("/bulk-count")
async def bulk_count(
    files: List[UploadFile],
    name: str = Form(...),
    description: str = Form(None),
    folder_uuid: str = Form(None),
    user: dict = Depends(LoginRequired(roles_required={TypeOfUser.PREMIUM})),
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    name, is_malicious = sanitize_filename(name)
    if is_malicious:
        raise HTTPException(400, detail="Name is not valid")
    if not folder_uuid:
        folder_uuid = Folder.retrieve_root(db, user['email']).id

    # Create new folder
    try:
        new_fldr = Folder.create(db, name = name,
            description=description,
            parent_id = folder_uuid,
            user_email = user['email'])
    except IntegrityError:
        raise HTTPException(400, detail="folder name already exists.")
    
    # Create new UploadFile objects for the background task
    files_data = []
    for file in files:
        file_content = await file.read()
        files_data.append(UploadFile(BytesIO(file_content), filename=file.filename))

    # Upload images in the background
    background_tasks.add_task(run_in_threadpool, upload_images_background, files_data, new_fldr.id, user, db)
    
    return {"Success" : True, "folder" : {
                "id": new_fldr.id,
                "name" : new_fldr.name,
                "create_date" : new_fldr.create_date
            }}


@router.get("/search-item")
async def search_item(
    folder_id: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    min_tassel_count: Optional[int] = None,
    max_tassel_count: Optional[int] = None,
    db: Session = Depends(get_db),
    user: dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM}))
):
    # if folder_id is none, then its the parent
    if not folder_id:
        folder_id = Folder.retrieve_root(db, user['email']).id
    else:
        fldr = Folder.retrieve(db, folder_id=folder_id)
        if fldr.user_email != user['email']:
            raise HTTPException(401, detail="Unauthorized")
        
    # parsing start and end dates
    try:
        start_date_obj = datetime.strptime(start_date, "%Y-%m-%d") if start_date else None
        end_date_obj = datetime.strptime(end_date, "%Y-%m-%d") if end_date else None
    except ValueError:
        raise HTTPException(400, detail="Date time invalid")

    offset = (page - 1) * page_size
    folders = [
        {"id": folder.id,"name": folder.name, "create_date": folder.create_date}
        for folder in Folder.search(db, folder_id=folder_id, user_email=user['email'], 
                                    offset=offset, page_size=page_size, search=search,
                                    start_date=start_date_obj, end_date=end_date_obj)
    ]

    remaining_limit = page_size - len(folders)
    if remaining_limit > 0:
        image_offset = max(0, offset - Folder.count(db, folder_id=folder_id, user_email=user['email'], search=search))
        images = Image.search(db, folder_id=folder_id, offset=image_offset, page_size=remaining_limit, search=search,
                              start_date=start_date_obj, end_date=end_date_obj, min_tassel_count=min_tassel_count,
                              max_tassel_count=max_tassel_count)
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

@router.get("/search-all-images")
async def search_all_images(folder_id: str, user: dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM})), db: Session = Depends(get_db)):
    fldr = Folder.retrieve(db, folder_id=folder_id)
    if fldr.user_email != user['email']:
        raise HTTPException(401, detail="Unauthorized")
    images = Image.search(db, folder_id=folder_id, status=TypeOfImageStatus.DONE)
    image_urls = await storage_mgr.get_image([image.thumbnail_url for image in images])
    return {
        "images" : [
            {
                "name" : image.name,
                "thumbnail_url" : url
            }
            for image, url in zip(images, image_urls)
        ]
    }

@router.get("/view-image")
async def view_image(img_name: str, folder_id: Optional[str] = None, db: Session = Depends(get_db), user: dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM}))):
    image_data = {}
    # Check if folder ID belongs to the user
    if not folder_id:
        fldr = Folder.retrieve_root(db, user_email=user['email'])
    else:
        fldr = Folder.retrieve(db, folder_id=folder_id)
        if fldr.user_email != user['email']:
            raise HTTPException(401, detail="Unauthorized")

    # Get image URL
    img = Image.retrieve(db, name=img_name, folder_id=fldr.id)

    image_data['name'] = img.name
    image_data['description'] = img.description
    image_data['size'] = round(img.size / (1024*1024), 2)
    image_data['width'] = img.width
    image_data['height'] = img.height
    image_data['status'] = img.processing_status
    image_data['upload_date'] = img.upload_date
    image_data['feedback'] = img.feedback
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
            Prediction.retrieve(db, folder_id=fldr.id, image_name=img_name)
        ]

    return image_data

@router.delete("/delete-image")
async def delete_image(image: ImagePayload, db: Session = Depends(get_db), user: dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM}))):
    # get the folder object
    if not image.folder_id:
        fldr = Folder.retrieve_root(db, user_email=user['email'])
    else:
        fldr = Folder.retrieve(db, folder_id=image.folder_id)
        if fldr.user_email != user['email']:
            raise HTTPException(401, detail="Unauthorized")

    # deleting the image
    try:
        img_url = Image.delete(db, name=image.name, folder_id=fldr.id)
        await storage_mgr.delete_image(img_url)
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
        folder = Folder.retrieve_root(db, user_email=user['email'])
        parent_folders.append({"name": folder.name, "id": folder.id})
        return {"Success": True, "parent_folders": parent_folders}

    curr_folder = Folder.retrieve(db, folder_id=folder_id)
    if curr_folder.user_email != user['email']:
        raise HTTPException(401, detail="Unauthorized")
    parent_folders.append({"name": curr_folder.name, "id": curr_folder.id})

    # Recursive search
    while curr_folder.parent_id != None:
        parent = Folder.retrieve(db, folder_id=curr_folder.parent_id)
        parent_folders.append({"name": parent.name, "id": parent.id})
        curr_folder = parent
    
    parent_folders.reverse()
    return {"Success": True, "parent_folders": parent_folders}

@router.post("/create-folder")
async def create_folder(folder: CreateFolderBody, db: Session = Depends(get_db), user:dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM}))): 
    if not folder.parent_id:
        folder.parent_id = Folder.retrieve_root(db, user_email=user['email']).id
    if not re.match(r'^[\w\s\.-]+$', folder.folder_name):
        raise HTTPException(400, detail="Name cannot contain special character")
    try:
        fldr = Folder.create(db, name = folder.folder_name,
        parent_id = folder.parent_id,
        user_email = user['email'])
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Folder with the same name already exists")
    return {"Success" : True,
            "folder" : {
                "id": fldr.id,
                "name" : fldr.name,
                "create_date" : fldr.create_date
            }}

@router.delete("/delete-folder")
def delete_folder(folder: FolderPayload, background_tasks: BackgroundTasks, db: Session = Depends(get_db), user:dict = Depends(LoginRequired(roles_required={TypeOfUser.PREMIUM}))):
    fldr = Folder.retrieve(db, folder_id=folder.folder_id)
    if not fldr or fldr.user_email != user['email']:
        raise HTTPException(401, detail="Unauthorized")
    Folder.delete(db, folder_id=folder.folder_id)
    background_tasks.add_task(storage_mgr.delete_folder, folder_path=f"{user['email']}/{folder.folder_id}")
    return {"Success" : True}

@router.patch("/rename-folder")
def rename_folder(folder: RenameFolderBody, db: Session = Depends(get_db), user:dict = Depends(LoginRequired(roles_required={TypeOfUser.PREMIUM}))):
    if not folder.folder_id:
        raise HTTPException(400, detail="Invalid folder")
    else:
        fldr = Folder.retrieve(db, folder_id=folder.folder_id)
        if not fldr or fldr.user_email != user['email']:
            raise HTTPException(401, detail="Unauthorized")
    if folder.new_name == "":
        raise HTTPException(400, detail="Folder name cannot be empty")
    if not re.match(r'^[\w\s\.-]+$', folder.new_name):
        raise HTTPException(400, detail="name cannot contain special character")
    try:
        fldr.update_self(db, folder_name=folder.new_name)
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Folder with the same name already exists")
    return {"Success" : True}

async def download_and_process_image(db:Session, zip_buffer:BytesIO, image, draw_boxes:bool, show_confidence:bool, box_color:str, subfolder:str = None):
    image_data = await storage_mgr.download_image(path=image.image_url)
    if image.processing_status == TypeOfImageStatus.DONE:
        predictions = Prediction.retrieve(db, folder_id=image.folder_id, image_name=image.name)
        
        if draw_boxes:
            # Open the image using PIL
            pil_image = PILImage.open(BytesIO(image_data))
            draw = ImageDraw.Draw(pil_image)
            font = ImageFont.load_default(size=round(max(pil_image.size) * 0.015))
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
            if image.image_url.endswith('.png'):
                pil_image.save(modified_image_buffer, format="PNG")
            else:
                pil_image.save(modified_image_buffer, format="JPEG")
            modified_image_buffer.seek(0)
            image_data = modified_image_buffer.getvalue()

        try:
            with zipfile.ZipFile(zip_buffer, "a") as zip_file:
                # Add the image to the zip file
                if subfolder is not None:
                    zip_file.writestr(os.path.join(subfolder, os.path.basename(image.image_url)), image_data)
                else:
                    zip_file.writestr(os.path.basename(image.image_url), image_data)

                # Create a text file with prediction information
                prediction_info = f"Total Boxes: {len(predictions)}\n\n"
                for prediction in predictions:
                    prediction_info += f"Box ID: {prediction.box_id}\n"
                    prediction_info += f"Coordinates: ({prediction.xCenter}, {prediction.yCenter})\n"
                    prediction_info += f"Width: {prediction.width}\n"
                    prediction_info += f"Height: {prediction.height}\n"
                    prediction_info += f"Confidence: {prediction.confidence}\n\n"
                if subfolder is not None:
                    zip_file.writestr(os.path.join(subfolder, f"predictions_{os.path.basename(image.image_url)}.txt"), prediction_info.encode('utf-8'))
                else:
                    zip_file.writestr(f"predictions_{os.path.basename(image.image_url)}.txt", prediction_info.encode('utf-8'))

            return zip_buffer
        except:
            raise HTTPException(detail='There was an error processing the data', status_code=400)
    else:
        try:
            with zipfile.ZipFile(zip_buffer, "a") as zip_file:
                # Add the image directly to the zip file without processing
                if subfolder is not None:
                    zip_file.writestr(os.path.join(subfolder, os.path.basename(image.image_url)), image_data)
                else:
                    zip_file.writestr(os.path.basename(image.image_url), image_data)

            return zip_buffer
        except:
            raise HTTPException(detail='There was an error processing the data', status_code=400)

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
        folder = Folder.retrieve_root(db, user_email=user['email'])
    else:
        folder = db.query(Folder).filter(Folder.id == folder_id, Folder.user_email == user['email']).one_or_none()
        folder = Folder.retrieve(db, folder_id=folder_id)
        if folder.user_email != user['email']:
            raise HTTPException(status_code=400, detail="Unauthorized")

    image = Image.retrieve(db, folder_id=folder.id, name=img_name)
    if image.processing_status == TypeOfImageStatus.DONE:
        zip_buffer = BytesIO()
        asyncio.run(download_and_process_image(db=db, zip_buffer=zip_buffer, 
                                               image=image,
                                               draw_boxes=draw_boxes, show_confidence=show_confidence,
                                               box_color=box_color))
        zip_buffer.seek(0)
        return Response(zip_buffer.getvalue(), media_type="application/zip", headers={
            "Content-Disposition": f"attachment;filename={image.name}.zip",
            "Content-Length": str(len(zip_buffer.getvalue())),
            "X-Total-Size": str(len(zip_buffer.getvalue()))
        })
    else:
        return {"url": asyncio.run(storage_mgr.get_image(image.image_url))[0]}

@router.get("/download-folder")
def download_folder(
    folder_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(LoginRequired(roles_required={TypeOfUser.PREMIUM}))):
    fldr = Folder.retrieve(db, folder_id=folder_id)
    if fldr.user_email != user['email']:
        raise HTTPException(401, detail="Unauthorized")
    
    # retrieve all images in the folder
    zip_buffer = BytesIO()
    def download_images(folder, zip_buffer:BytesIO, sub_folder:str = None):
        images = Image.search(db, folder.id, offset=None, page_size=None)
        if len(images) > 0:
            for img in images:
                asyncio.run(download_and_process_image(db, zip_buffer=zip_buffer, image=img, draw_boxes=True, show_confidence=False, box_color="#FF0000", subfolder=sub_folder))
        else:
            # Create an empty folder
            with zipfile.ZipFile(zip_buffer, "a") as zip_file:
                empty_folder_path = os.path.join(sub_folder, "") if sub_folder else folder.name + "/"
                zip_file.writestr(empty_folder_path, b"")
        # do the same for all the child folders
        sub_folders = folder.retrieve_child(db)
        for child_folder in sub_folders:
            if sub_folder is None:
                download_images(child_folder, zip_buffer=zip_buffer, sub_folder=child_folder.name)
            else:
                download_images(child_folder, zip_buffer=zip_buffer, sub_folder=os.path.join(sub_folder, child_folder.name))

    download_images(folder=fldr, zip_buffer=zip_buffer)
    
    zip_buffer.seek(0)
    return Response(zip_buffer.getvalue(), media_type="application/zip", headers={
        "Content-Disposition": f"attachment;filename={fldr.name}.zip",
        "Content-Length": str(len(zip_buffer.getvalue())),
        "X-Total-Size": str(len(zip_buffer.getvalue()))
    })

@router.patch("/rename-image")
async def rename_image(image : RenameImageBody, db : Session = Depends(get_db), user:dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM}))):
    if not image.folder_id:
        fldr = Folder.retrieve_root(db, user_email=user['email'])
    else:
        fldr = Folder.retrieve(db, folder_id=image.folder_id)
        if fldr.user_email != user['email']:
            raise HTTPException(401, detail="Unauthorized")
    if image.new_name == "":
        raise HTTPException(400, detail="Image name cannot be empty")
    if not re.match(r'^[\w\s\.-]+$', image.new_name):
        raise HTTPException(400, detail="Image name cannot contain special character")
    try:
        img = Image.update(db, old_name=image.name, folder_id=fldr.id, name=image.new_name)
        new_img_url, new_thumbnail_url = await storage_mgr.rename_image(img.image_url, img.thumbnail_url, image.new_name)
        img.update_self(db, image_url=new_img_url, thumbnail_url=new_thumbnail_url)
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Image with the same name already exists")
    return {"Success" : True, "new_name" : img.name}

@router.get("/total-storage")
def total_storage(user: dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM})), db: Session = Depends(get_db)):
    return {"Success" : True, "count" : Image.count(db, email=user['email'])}

@router.patch("/give-feedback")
def give_feedback(image: ImageFeedback, user: dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM})), db: Session = Depends(get_db)):
    # Preliminary check
    if not image.folder_id:
        fldr = Folder.retrieve_root(db, user_email=user['email'])
        image.folder_id = fldr.id
    else:
        fldr = Folder.retrieve(db, folder_id=image.folder_id)
        if fldr and fldr.user_email != user['email']:
            raise HTTPException(401, detail="You are not the owner of the image")
    # Give prediction
    img = Image.retrieve(db, name=image.name, folder_id=image.folder_id)
    if img and img.processing_status != TypeOfImageStatus.DONE:
        raise HTTPException(400, detail="image has not yet finish processing")
    img.update_self(db, feedback=image.good)
    return {"Success" : True}

@router.get("/view-historical-count")
def view_historical_count(
    folder_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user: dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM})),
    db: Session = Depends(get_db)
):
    if not folder_id:
        fldr = Folder.retrieve_root(db, user_email=user['email'])
    else:
        fldr = Folder.retrieve(db, folder_id=folder_id)
    if fldr.user_email != user['email']:
        raise HTTPException(401, detail="The folder is not yours")
    
    # parsing start and end dates
    try:
        start_date_obj = datetime.strptime(start_date, "%Y-%m-%d") if start_date else None
        end_date_obj = datetime.strptime(end_date, "%Y-%m-%d") if end_date else None
    except ValueError:
        raise HTTPException(400, detail="Date time invalid")

    # retrieving folders
    all_folders = []
    def collect_folders(folder):
        all_folders.append(folder)
        child_folders = folder.retrieve_child(db, start_date=start_date_obj, end_date=end_date_obj)
        for child_folder in child_folders:
            collect_folders(child_folder)
    collect_folders(fldr)

    # retrieving tassel_count by date for all folders
    folder_ids = [folder.id for folder in all_folders]
    tassel_counts = Image.get_tassel_count_by_date(db, folder_ids, start_date=start_date_obj, end_date=end_date_obj)

    counts_by_date = []
    total = 0
    highest = 0
    lowest = float('inf')
    for tassel_count in tassel_counts:
        counts_by_date.append({
            "date": tassel_count.date,
            "total_tassel_count": tassel_count.total_tassel_count
        })
        total += tassel_count.total_tassel_count
        if tassel_count.total_tassel_count > highest:
            highest = tassel_count.total_tassel_count
        if tassel_count.total_tassel_count < lowest:
            lowest = tassel_count.total_tassel_count

    percentage_change = 0
    if len(counts_by_date) > 1:
        first_count = counts_by_date[0]["total_tassel_count"]
        last_count = counts_by_date[-1]["total_tassel_count"]
        percentage_change = ((last_count - first_count) / first_count) * 100

    return {
        "date_count": counts_by_date,
        "total" : total,
        "average_per_day" : 0 if len(counts_by_date) == 0 else round(total / len(counts_by_date), 2),
        "highest" : highest,
        "lowest" : lowest if isfinite(lowest) else 0,
        "percentage_change": round(percentage_change, 2)
    }

@router.get("/search-all-folders")
def search_all_folders(user: dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM})), db: Session = Depends(get_db)):
    fldrs = Folder.search_all(db, email=user['email'])
    return {
        "folder_list" : [{"name" : fldr.name, "id" : fldr.id} for fldr in fldrs]
    }

@router.get("/search-all-folders-indiv")
def search_all_folders(user: dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM})), db: Session = Depends(get_db)):
    fldrs = Folder.search_all(db, email=user['email'])
    return {
        "folder_list" : [{"name" : fldr.name, "id" : fldr.id} for fldr in fldrs]
    }

@router.get("/view-weather-forecast")
def view_weather_forecast(lon: float, lat: float, _: dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR, TypeOfUser.PREMIUM}))):
    res = requests.get("https://api.openweathermap.org/data/2.5/forecast/daily",
                        params={
                            "lat" : lat,
                            "lon" : lon,
                            "appid" : Config.OPEN_WEATHER_API,
                            "cnt" : 14
                        })
    res = json.loads(res.text)
    return res
    

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
                    'folder_id' : target.folder.id if target.folder.parent_id else None,
                    'name': target.name,
                    'status': new_status
                }, room=session_id))