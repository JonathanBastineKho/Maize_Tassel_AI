from fastapi import APIRouter, Depends, Header, HTTPException
import json
import hmac
import hashlib
from datetime import timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
from config import Config
from app.database.utils import get_db
from app.database.schema import Image, Prediction, TypeOfImageStatus
from app.utils.payload import JobStatus, JobPrediction

router = APIRouter(tags=["WebHook"], prefix="/hook")

def verify_signature(data:dict, signature: str):
    data = {
        'name' : data["name"],
        'folder_id' : data['folder_id']
    }
    payload_json = json.dumps(data).encode('utf-8')
    expected_signature = hmac.new(Config.SECRET_KEY.encode('utf-8'), payload_json, hashlib.sha256).hexdigest()
    return hmac.compare_digest(signature, expected_signature)

@router.patch("/update-job-status")
async def update_job_status(job_status: JobStatus, signature: str = Header(...), db: Session = Depends(get_db)):
    if not verify_signature(job_status.model_dump(), signature):
        raise HTTPException(403, detail="Invalid signature")
    
    # Check if image name and folder id is valid
    image = db.query(Image).filter(Image.folder_id == job_status.folder_id, Image.name == job_status.name).one_or_none()
    if not image:
        raise HTTPException(400, detail="Invalid image name or folder")
    
    image.processing_status = job_status.job_status
    db.commit()
    return {"Success" : True}

@router.post("/finish-prediction")
async def prediction(prediction:JobPrediction, signature: str = Header(...), db: Session = Depends(get_db)):
    if not verify_signature(prediction.model_dump(), signature):
        raise HTTPException(403, detail="Invalid signature")
    
    # Check if image name and folder id is valid
    image = db.query(Image).filter(Image.folder_id == prediction.folder_id, Image.name == prediction.name).one_or_none()
    if not image:
        raise HTTPException(400, detail="Invalid image name or folder")
    
    # Inserting to database
    counter = 1
    for pred_box in prediction.box:
        db.add(
            Prediction(
                image_name=prediction.name,
                folder_id=prediction.folder_id,
                box_id=counter,
                xCenter=pred_box.get('xCenter'),
                yCenter=pred_box.get('yCenter'),
                width=pred_box.get('width'),
                height=pred_box.get('height'),
                confidence=pred_box.get('confidence'),
            )
        )
        counter += 1
    # Change the status of the processing
    image.processing_status = TypeOfImageStatus.DONE
    image.finish_date = func.now(timezone=timezone.utc)
    db.commit()
    
    return {"Success" : True}