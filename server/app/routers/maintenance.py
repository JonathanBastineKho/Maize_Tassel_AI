import asyncio, uuid
import wandb
import time 
from fastapi import APIRouter, Depends, HTTPException, Response
from typing import Optional, List
from config import Config
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.utils.payload import CreateDataset, LoginRequired, ImagePayload, TrainParams, DeployModel, ReannotateImage, CroppedImage, ImageDataset
from app.utils import storage_mgr, cloud_run_mgr, llm_mgr, job_mgr
from app.database.utils import get_db
from app.database.schema import Model, TypeOfUser, Dataset, DatasetImageLink, Image, TypeOfImageStatus, Prediction, Label


router = APIRouter(tags=["Maintenance"], prefix="/maintenance")

@router.get("/search-images")
def search_images(
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        dataset_name: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        min_tassel_count: Optional[int] = None,
        max_tassel_count: Optional[int] = None,
        filter_bad_feedback: Optional[bool] = False,
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
    if dataset_name:
        results = DatasetImageLink.search_images(db, dataset_name=dataset_name, offset=offset, page_size=page_size,
                              start_date=start_date_obj, end_date=end_date_obj, min_tassel_count=min_tassel_count,
                              max_tassel_count=max_tassel_count)
        images, dataset_image_urls, dataset_thumbnail_urls, label_counts = [], [], [], []
        for result in results:
            images.append(result[0])
            dataset_image_urls.append(result[1])
            dataset_thumbnail_urls.append(result[2])
            label_counts.append(result[3])
    else:
        images = Image.search(db, offset=offset, page_size=page_size,
                                start_date=start_date_obj, end_date=end_date_obj, min_tassel_count=min_tassel_count,
                                max_tassel_count=max_tassel_count, status=TypeOfImageStatus.DONE, filter_bad_feedback=filter_bad_feedback)
    has_more = len(images) > 0
    new_dataset_image_urls, new_dataset_thumbnail_urls, new_label_counts = [], [], []
    # Filtering the images through LLM
    if len(images) > 0 and search:
        if dataset_name:
            img_uris = [f"gs://{Config.PRIVATE_BUCKET_NAME}/{url}" for url in dataset_image_urls]
        else:
            img_uris = [f"gs://{Config.PRIVATE_BUCKET_NAME}/{image.image_url}" for image in images]
        img_idx = llm_mgr.filter_image(image_uris=img_uris, search=search)
        images = [images[i] for i in img_idx if i < len(images)]
        if dataset_name:
            
            for i in img_idx:
                if i < len(label_counts):
                    new_dataset_image_urls.append(dataset_image_urls[i])
                    new_dataset_thumbnail_urls.append(dataset_thumbnail_urls[i])
                    new_label_counts.append(label_counts[i])
    # Getting the data
    if dataset_name:
        if search:
            image_urls = asyncio.run(storage_mgr.get_image([url for url in new_dataset_thumbnail_urls]))
        else:
            image_urls = asyncio.run(storage_mgr.get_image([url for url in dataset_thumbnail_urls]))
    else:
        image_urls = asyncio.run(storage_mgr.get_image([image.thumbnail_url for image in images]))
    if not search and dataset_name:
        new_label_counts = label_counts
    image_data = [
        {
            "name": image.name,
            "folder_id": image.folder_id,
            "status": image.processing_status,
            "tassel_count": label_count if dataset_name else image.tassel_count,
            "upload_date": image.upload_date.strftime('%Y-%m-%dT%H:%M:%S%z'),
            "thumbnail_url": thumb_url
        }
        for image, thumb_url, label_count in zip(
            images, 
            image_urls, 
            new_label_counts if dataset_name else [None] * len(images)
        )
    ]
    return {"Success" : True,
            "has_more" : has_more,
            "images" : image_data}

@router.get("/view-image")
async def view_image(dataset_name: str, image_name: str, folder_id: str, db: Session = Depends(get_db), _: dict = Depends(LoginRequired(roles_required={TypeOfUser.ADMIN}))):
    image_data = {}

    img, feedback, upload_date = DatasetImageLink.retrieve(db, dataset_name=dataset_name, image_name=image_name, folder_id=folder_id)
    image_data['name'] = img.image_name
    image_data['upload_date'] = upload_date
    image_data['feedback'] = feedback
    url = await storage_mgr.get_image([img.image_url, img.thumbnail_url])
    image_data['thumbnail_url'] = url[1]
    image_data['url'] = url[0]
    image_data['label'] = [
            {
                "xCenter" : box.xCenter,
                "yCenter" : box.yCenter,
                "width" : box.width,
                "height" : box.height,
            }
            for box in
            Label.retrieve(db, dataset_name=dataset_name, folder_id=folder_id, image_name=image_name)
        ]
    return image_data

@router.post("/create-dataset")
def create_dataset(dataset: CreateDataset, db: Session = Depends(get_db), user: dict = Depends(LoginRequired(roles_required={TypeOfUser.ADMIN}))):
    try:
        dtset = Dataset.create(db, name=dataset.name)
        return {"Success": True, "dataset" : {"name" : dtset.name, "create_date": dtset.create_date}}
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

@router.delete("/remove-image-dataset")
def remove_image_dataset(img: ImageDataset, db: Session = Depends(get_db), _: dict = Depends(LoginRequired(roles_required={TypeOfUser.ADMIN}))):
    im = DatasetImageLink.retrieve(db, dataset_name=img.name, image_name=img.img_name, folder_id=img.folder_id)
    im[0].delete(db)

@router.delete("/delete-dataset")
def delete_dataset(dataset: CreateDataset, db: Session = Depends(get_db), _: dict = Depends(LoginRequired(roles_required={TypeOfUser.ADMIN}))):
    dts = Dataset.retrieve(db, dataset_name=dataset.name)
    dts.delete(db)

@router.patch("/crop-image")
async def crop_image(crop_image: CroppedImage, db: Session = Depends(get_db), _: dict = Depends(LoginRequired(roles_required={TypeOfUser.ADMIN}))):
    try:
        # Retrieve the dataset image
        dataset_image, __, __ = DatasetImageLink.retrieve(db, dataset_name=crop_image.dataset_name, image_name=crop_image.image_name, folder_id=crop_image.folder_id)
        
        # Crop the image
        await storage_mgr.crop_image(image_path=dataset_image.image_url, thumbnail_path=dataset_image.thumbnail_url, crop_data=crop_image.crop_data)
        
        # Retrieve all labels for this image
        labels = Label.retrieve(
            db,
            dataset_name=crop_image.dataset_name,
            folder_id=crop_image.folder_id,
            image_name=crop_image.image_name
        )

        # Filter and adjust labels based on the new crop
        new_labels = []
        for label in labels:
            label_left = label.xCenter - label.width / 2
            label_right = label.xCenter + label.width / 2
            label_top = label.yCenter - label.height / 2
            label_bottom = label.yCenter + label.height / 2

            if (label_left >= crop_image.crop_data['x'] and
                label_right <= crop_image.crop_data['x'] + crop_image.crop_data['width'] and
                label_top >= crop_image.crop_data['y'] and
                label_bottom <= crop_image.crop_data['y'] + crop_image.crop_data['height']):

                new_label = {
                    'box_id': label.box_id,
                    'xCenter': label.xCenter - crop_image.crop_data['x'],
                    'yCenter': label.yCenter - crop_image.crop_data['y'],
                    'width': label.width,
                    'height': label.height
                }
                new_labels.append(new_label)

        # Clear the session to avoid conflicts
        db.expunge_all()

        # Update labels in the database
        updated_labels = Label.update(
            db,
            dataset_name=crop_image.dataset_name,
            folder_id=crop_image.folder_id,
            image_name=crop_image.image_name,
            new_labels=new_labels
        )

        return {
            "new_labels": [
                {
                    "xCenter": box.xCenter,
                    "yCenter": box.yCenter,
                    "width": box.width,
                    "height": box.height,
                }
                for box in updated_labels
            ]
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error during image cropping: {str(e)}")

@router.patch("/reannotate-image")
def annotage_image(new_label_data: ReannotateImage, db: Session = Depends(get_db), _: dict = Depends(LoginRequired(roles_required={TypeOfUser.ADMIN}))):
    new_labels = Label.update(db, 
                              dataset_name=new_label_data.dataset_name, 
                              folder_id=new_label_data.folder_id, 
                              image_name=new_label_data.image_name,
                              new_labels=new_label_data.new_label)
    return {
        "new_labels" : [
            {
                "xCenter" : box.xCenter,
                "yCenter" : box.yCenter,
                "width" : box.width,
                "height" : box.height,
            }
            for box in new_labels
        ]
    }
@router.post("/train-model")
def train_model(train_params: TrainParams, db: Session = Depends(get_db), _: dict = Depends(LoginRequired(roles_required={TypeOfUser.ADMIN}))):
    # Check for running Cloud Run jobs
    if cloud_run_mgr.check_running_cloud_run_jobs():
        raise HTTPException(status_code=503, detail="There are still job running")
    
    if Model.retrieve(db, version=train_params.base_model_version).finish_train_date == None:
        raise HTTPException(status_code=400, detail="Base Model cannot be trained")
    
    # Label preparation
    label_data = {}
    total_images = 0
    for dataset_name in train_params.dataset_names:
        label_data[dataset_name] = {}
        images = Dataset.search_images(db, dataset_name=dataset_name)
        total_images += len(images)
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
    if total_images == 0:
        raise HTTPException(status_code=400, detail="No images found inside")
    # Upload labels to the google cloud
    storage_mgr.export_label_data(label_data=label_data, export_dir="temp/labels_export.json")
    model_version = Model.count(db)
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
            "--webhook_url", str(Config.TRAIN_WEBHOOK_URL),
            "--model_version", str(model_version),
            "--gpu"
        ]
    
    cloud_run_mgr.run_job(
        location='asia-southeast1',
        service_name=f"train-model-service-{uuid.uuid4()}",
        args=job_args)
    
@router.get("/model-metric")
def model_metric(run_id: str, _: dict = Depends(LoginRequired(roles_required={TypeOfUser.ADMIN}))):
    if not Config.WANDB_API or not Config.WANDB_ENTITY or not Config.WANDB_PROJECT:
        raise HTTPException(500, detail="Please provide your WANDB API, WANDB_ENTITY and WANDB Project name")
    try:
        api = wandb.Api()
        run = api.run(f"{Config.WANDB_PROJECT}/{Config.WANDB_ENTITY}/{run_id}")
        
        # Get the history of the run
        history = run.scan_history(keys=[
            "metrics/precision(B)",
            "val/box_loss",
            "metrics/recall(B)",
            "metrics/mAP50(B)"
        ])
        
        # Initialize dictionaries to store the metrics
        precision = []
        box_loss = []
        recall = []
        map50 = []

        # Iterate through the history and extract the required metrics
        for step, row in enumerate(history):
            if 'metrics/precision(B)' in row:
                precision.append({"x": step, "y": row['metrics/precision(B)']})
            if 'val/box_loss' in row:
                box_loss.append({"x": step, "y": row['val/box_loss']})
            if 'metrics/recall(B)' in row:
                recall.append({"x": step, "y": row['metrics/recall(B)']})
            if 'metrics/mAP50(B)' in row:
                map50.append({"x": step, "y": row['metrics/mAP50(B)']})
        return {
            "box_loss": box_loss,
            "precision": precision,
            "recall": recall,
            "map50": map50,
            "status" : run.state
        }

    except wandb.errors.CommError:
        raise HTTPException(400, detail="Run ID not found")
    
@router.get("/model-list")
def model_list(db: Session = Depends(get_db), _: dict = Depends(LoginRequired(roles_required={TypeOfUser.ADMIN}))):
    models = []
    model_list = Model.search(db)
    default_selected_idx = 0
    for i in range(len(model_list)):
        models.append({
                "version" : model_list[i].version,
                "finish_train_date" : model_list[i].finish_train_date,
                "test_map" : model_list[i].test_map,
                "test_mae" : model_list[i].test_mae,
                "deployed" : model_list[i].deployed
            })
        if model_list[i].deployed:
            default_selected_idx = i
    return {
        "models" : model_list,
        "default_selected_idx" : default_selected_idx
    }

@router.patch("/deploy-model")
def deploy_model(model_deploy: DeployModel, db: Session = Depends(get_db), _: dict = Depends(LoginRequired(roles_required={TypeOfUser.ADMIN}))):
    model = Model.retrieve(db, version=model_deploy.version)
    if model == None or model.finish_train_date == None:
        raise HTTPException(400, detail="Model still not finish training")
    if model.deployed:
        raise HTTPException(400, detail="Model already deployed")
    
    try:
        old_model = Model.get_deployed_model(db)
        old_model.update_self(db, deployed=False)
        model.update(db, version=model_deploy.version, deployed=True)
        job_mgr.broadcast_model_update(model.model_url)
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/worker-stats")
def get_queue_stats(_: dict = Depends(LoginRequired(roles_required={TypeOfUser.ADMIN}))):
    try: 
        stats = job_mgr.get_queue_stats() 
        return {'stats': stats}
        
    except Exception as e:
        raise HTTPException(500, detail=f"An error occurred while getting queue stats: {str(e)}")