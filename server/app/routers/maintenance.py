import asyncio, os
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.utils.payload import CreateDataset, LoginRequired, ImagePayload, TrainParams
from app.utils import storage_mgr
from app.database.utils import get_db
from app.database.schema import TypeOfUser, Dataset, DatasetImageLink, Image, TypeOfImageStatus, Prediction, Label

router = APIRouter(tags=["Maintenance"], prefix="/maintenance")

@router.get("/search-images")
async def search_images(
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        min_tassel_count: Optional[int] = None,
        max_tassel_count: Optional[int] = None,
        db: Session = Depends(get_db),
        _: dict = Depends(LoginRequired(roles_required={TypeOfUser.ADMIN}))):
    # parsing start and end dates
    try:
        start_date_obj = datetime.strptime(
            start_date, "%Y-%m-%d") if start_date else None
        end_date_obj = datetime.strptime(
            end_date, "%Y-%m-%d") if end_date else None
    except ValueError:
        raise HTTPException(400, detail="Date time invalid")
    offset = (page - 1) * page_size
    images = Image.search(db, offset=offset, page_size=page_size, search=search,
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
    return {"Success" : True,
            "images" : image_data}

@router.post("/create-dataset")
def create_dataset(dataset: CreateDataset, db: Session = Depends(get_db), user: dict = Depends(LoginRequired(roles_required={TypeOfUser.ADMIN}))):
    try:
        Dataset.create(db, name=dataset.name)
        return {"Success": True}
    except IntegrityError:
        raise HTTPException(400, detail="Duplicate name")


@router.post("/add-image")
async def add_image(dataset: CreateDataset, images: List[ImagePayload], db: Session = Depends(get_db), _: dict = Depends(LoginRequired(roles_required={TypeOfUser.ADMIN}))):
    storage_tasks = []

    for image in images:
        img = Image.retrieve(db, name=image.name, folder_id=image.folder_id)
        if img.processing_status != TypeOfImageStatus.DONE:
            raise HTTPException(400, detail="Image has not done processing yet")
        
        try:            
            DatasetImageLink.create(db, dataset_name=dataset.name,
                                    image_name=img.name, image_folder_id=img.folder_id,
                                    image_url=f"dataset/{dataset.name}/{img.folder_id}/image/{img.name}",
                                    thumbnail_url=f"dataset/{dataset.name}/{img.folder_id}/thumbnail/{img.name}")
            preds = Prediction.retrieve(db, folder_id=img.folder_id, image_name=img.name)
            for pred in preds:
                Label.create(db, dataset_name=dataset.name, image_name=img.name, image_folder_id=img.folder_id,
                             box_id=pred.box_id, xCenter=pred.xCenter, yCenter=pred.yCenter, width=pred.width, height=pred.height)
            storage_tasks.append(storage_mgr.add_image_to_dataset(dataset.name, img.name, img.folder_id, img.image_url, img.thumbnail_url))
        except IntegrityError:
            raise HTTPException(400, detail="Image already added to the dataset")

    try:
        await asyncio.gather(*storage_tasks)
    except Exception as e:
        raise HTTPException(500, detail=f"An error occurred while processing images: {str(e)}")
    
    return {"Success": True}

@router.patch("/edit-image")
def edit_image():
    pass

@router.patch("/annotate-image")
def annotage_image():
    pass

@router.post("/train-model")
def train_model(train_params: TrainParams, db: Session = Depends(get_db), _: dict = Depends(LoginRequired(roles_required={TypeOfUser.ADMIN}))):
    # Label preparation
    label_data = {}
    for dataset_name in train_params.dataset_names:
        images = Dataset.search_images(db, dataset_name=dataset_name)
        for image in images:
            labels = Label.retrieve(db, folder_id=image.folder_id, image_name=image.name)
        label_data[dataset_name][f"{image.folder_id}/{image.name}"] = [
            {
                "box_id": label.box_id,
                "xCenter": label.xCenter,
                "yCenter": label.yCenter,
                "width": label.width,
                "height": label.height
            }
            for label in labels
        ]
    
    # Upload labels to the google cloud
    label_url = storage_mgr.export_label_data(label_data=label_data, export_dir="labels_export.json")

@router.patch("/deploy-model")
def deploy_model():
    pass
