import asyncio, uuid
from fastapi import APIRouter, Depends, HTTPException, Response
from typing import Optional, List
from config import Config
from datetime import datetime
import time
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.utils.payload import CreateDataset, LoginRequired, ImagePayload, TrainParams
from app.utils import storage_mgr, cloud_run_mgr, llm_mgr, job_mgr
from app.database.utils import get_db
from app.database.schema import TypeOfUser, Dataset, DatasetImageLink, Image, TypeOfImageStatus, Prediction, Label

router = APIRouter(tags=["Maintenance"], prefix="/maintenance")

@router.get("/search-images")
def search_images(
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
    images = Image.search(db, offset=offset, page_size=page_size,
                              start_date=start_date_obj, end_date=end_date_obj, min_tassel_count=min_tassel_count,
                              max_tassel_count=max_tassel_count, status=TypeOfImageStatus.DONE)
    has_more = len(images) > 0
    if len(images) > 0 and search:
        img_idx = llm_mgr.filter_image(
            image_uris=[
                f"gs://{Config.PRIVATE_BUCKET_NAME}/{image.image_url}"
                for image in images
            ],
            search=search
        )
        images = [images[i] for i in img_idx if i < len(images)]
    image_urls = asyncio.run(storage_mgr.get_image([image.thumbnail_url for image in images]))
    image_data = [
        {
            "name" : image.name,
            "folder_id" : image.folder_id,
            "status": image.processing_status,
            "upload_date": image.upload_date.strftime('%Y-%m-%dT%H:%M:%S%z'),
            "thumbnail_url": url
        }
        for image, url in zip(images, image_urls)
        ]
    return {"Success" : True,
            "has_more" : has_more,
            "images" : image_data}

@router.post("/create-dataset")
def create_dataset(dataset: CreateDataset, db: Session = Depends(get_db), user: dict = Depends(LoginRequired(roles_required={TypeOfUser.ADMIN}))):
    try:
        Dataset.create(db, name=dataset.name)
        return {"Success": True}
    except IntegrityError:
        raise HTTPException(400, detail="Duplicate name")
    
@router.get("/search-dataset")
def search_dataset(dataset: Optional[str] = None,
                   page: int = 1,
                   page_size: int = 20,
                   db: Session = Depends(get_db), user: dict = Depends(LoginRequired(roles_required={TypeOfUser.ADMIN}))):
    offset = (page - 1) * page_size
    datasets = Dataset.search(db, dataset_name=dataset, offset=offset, page_size=page_size)
    return {
        "Success" : True,
        "dataset" : [
            {
                "name" : dataset.name,
                "create_date" : dataset.create_date
            }
            for dataset in datasets
        ]
    }

@router.post("/add-image")
async def add_image(response: Response, dataset: CreateDataset, images: List[ImagePayload], db: Session = Depends(get_db), _: dict = Depends(LoginRequired(roles_required={TypeOfUser.ADMIN}))):
    storage_tasks = []
    not_done_image = 0
    duplicate_image = 0

    for image in images:
        img = Image.retrieve(db, name=image.name, folder_id=image.folder_id)
        if img.processing_status != TypeOfImageStatus.DONE:
            not_done_image += 1
        
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
            duplicate_image += 1
            db.rollback()

    try:
        await asyncio.gather(*storage_tasks)
    except Exception as e:
        response.status = 500
        raise HTTPException(500, detail=f"An error occurred while processing images: {str(e)}")
    
    if not_done_image + duplicate_image == len(images):
        response.status = 400
        raise HTTPException(400, detail=f"All {len(images)} images are already added")
    elif not_done_image > 0 or duplicate_image > 0:
        response.status_code = 206
        return {
            "Success" : False,
            "not_done_count": not_done_image,
            "duplicate_count": duplicate_image
        }
    response.status_code = 200
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
        label_data[dataset_name] = {}
        images = Dataset.search_images(db, dataset_name=dataset_name)
        for image in images:
            labels = Label.retrieve(db, folder_id=image.image_folder_id, image_name=image.image_name)
            label_data[dataset_name][f"{image.image_folder_id}/image/{image.image_name}"] = [
                {
                    "box_id": label.box_id,
                    "xCenter": label.xCenter / image.image.width,
                    "yCenter": label.yCenter / image.image.height,
                    "width": label.width / image.image.width,
                    "height": label.height / image.image.height
                }
                for label in labels
            ]
    
    # Upload labels to the google cloud
    label_url = storage_mgr.export_label_data(label_data=label_data, export_dir="temp/labels_export.json")

    # Submit Training job
    job_args = [
            "--dataset_names", *train_params.dataset_names,
            "--base_model_version", str(train_params.base_model_version),
            "--epochs", str(train_params.epochs),
            "--patience", str(train_params.patience),
            "--batch", str(train_params.batch),
            "--imgsz", str(train_params.imgsz),
            "--dropout", str(train_params.dropout),
            "--freeze", str(train_params.freeze_layers),
            "--optimizer", train_params.optimizer,
            "--learning_rate", str(train_params.learning_rate),
        ]
    if train_params.gpu:
        job_args.append("--gpu")
    
    cloud_run_mgr.run_job(
        location='asia-southeast1',
        service_name=f"train-model-service-{uuid.uuid4()}",
        args=job_args)
    
@router.patch("/deploy-model")
def deploy_model():
    pass

@router.get("/queue-stats")
def get_queue_stats(poll_interval = 5, timeout = 60):
    
    start_time = time.time()
    try: 
        stats = job_mgr.get_queue_stats() 
        # if stats['messages'] > 0:
        #     return {"Success": True, "stats": stats}
        
        # if time.time() - start_time > timeout:
        #     return {"Success": False, "messsage": "Timeout"}
       
        # time.sleep(poll_interval)
        return {"Success": True, "stats": stats}
        
    except Exception as e:
        raise HTTPException(500, detail=f"An error occurred while getting queue stats: {str(e)}")