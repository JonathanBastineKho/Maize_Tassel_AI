from fastapi import APIRouter, Depends, Header, HTTPException, Request, BackgroundTasks
import json
import hmac
import hashlib
import stripe
from datetime import timezone, datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from config import Config
from typing import Optional
from app.database.utils import get_db
from app.database.schema import Image, Prediction, Transaction, TypeOfImageStatus, User, TypeOfUser, Model
from app.utils.payload import JobStatus, JobPrediction, TrainingHookPayload
from app.utils import session_mgr, email_sender

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
async def update_job_status(background_tasks: BackgroundTasks, job_status: JobStatus, signature: str = Header(...), db: Session = Depends(get_db)):
    if not verify_signature(job_status.model_dump(), signature):
        raise HTTPException(403, detail="Invalid signature")
    
    Image.update(db, old_name=job_status.name, folder_id=job_status.folder_id, processing_status=job_status.job_status)
    if job_status.job_status == TypeOfImageStatus.ERROR:
        if not job_status.job_id:
            # send email directly
            background_tasks.add_task(
                email_sender.send_prediction_email,
                email=job_status.email,
                link=f"http://localhost:5173/user/images/{job_status.folder_id}/{job_status.name}",
                status=TypeOfImageStatus.ERROR
            )
        elif session_mgr.increment_job_current_count(job_status['job_id'], has_error=True)[0]:
            # send email notifying 
            background_tasks.add_task(
                email_sender.send_prediction_email,
                email=job_status.email,
                link=f"http://localhost:5173/user/images/{job_status.folder_id}",
                status=TypeOfImageStatus.ERROR
            )
    return {"Success" : True}

@router.post("/finish-prediction")
async def prediction(background_tasks: BackgroundTasks, prediction:JobPrediction, signature: str = Header(...), db: Session = Depends(get_db)):
    if not verify_signature(prediction.model_dump(), signature):
        raise HTTPException(403, detail="Invalid signature")
    
    # Inserting to database
    counter = 1
    for pred_box in prediction.box:
        Prediction.create(db, image_name=prediction.name,
                folder_id=prediction.folder_id,
                box_id=counter,
                xCenter=pred_box.get('xCenter'),
                yCenter=pred_box.get('yCenter'),
                width=pred_box.get('width'),
                height=pred_box.get('height'),
                confidence=pred_box.get('confidence'))
        counter += 1
    # Change the status of the processing
    Image.update(db, old_name=prediction.name, folder_id=prediction.folder_id, processing_status=TypeOfImageStatus.DONE, finish_date=func.now(timezone=timezone.utc), tassel_count=counter-1)
    if not prediction.job_id:
        # send email directly
        background_tasks.add_task(
            email_sender.send_prediction_email,
            email=prediction.email,
            link=f"http://localhost:5173/user/images/{prediction.folder_id}/{prediction.name}",
            status=TypeOfImageStatus.DONE
        )
    else:
        res = session_mgr.increment_job_current_count(prediction.job_id, has_error=False)
        # if done processing and has error
        if res[0] and res[1]:
            background_tasks.add_task(
                email_sender.send_prediction_email,
                email=prediction.email,
                link=f"http://localhost:5173/user/images/{prediction.folder_id}",
                status=TypeOfImageStatus.ERROR
            )
        elif res[0] and not res[1]:
            background_tasks.add_task(
                email_sender.send_prediction_email,
                email=prediction.email,
                link=f"http://localhost:5173/user/images/{prediction.folder_id}",
                status=TypeOfImageStatus.DONE
            )
    return {"Success" : True}

@router.post("/stripe")
async def stripe_hook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    signature = request.headers.get("Stripe-Signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, signature, Config.STRIPE_WEBHOOK
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    session = event['data']['object']
    
    # if subscription is successful (successful initial subscribe, renewal and cancellation)
    if event["type"] == "customer.subscription.updated":
        email = stripe.Customer.retrieve(session["customer"]).get("email")
        cancel_at_period_end = session.get("cancel_at_period_end", False)
        # When user cancel their subscription
        if cancel_at_period_end:
            latest_transaction = Transaction.retrieve_latest(db, user_email=email)

            if latest_transaction:
                Transaction.update(db, latest_transaction, False)

        # When user subscribes or renews the subscription
        elif not cancel_at_period_end and session.get("status") == "active":
            latest_transaction = Transaction.retrieve_latest(db, user_email=email)

            if latest_transaction:
                # Renewal
                Transaction.update(db, latest_transaction, True)
            else:
                # New subscription
                Transaction.create(
                    db=db,
                    transaction_id=session["id"],
                    user_email=email,
                    start_date=datetime.fromtimestamp(session["current_period_start"], tz=timezone.utc),
                    end_date=datetime.fromtimestamp(session["current_period_end"], tz=timezone.utc),
                    currency=session["plan"]["currency"],
                    amount=session["plan"]["amount"] / 100
                )
                User.update(db, email=email, role=TypeOfUser.PREMIUM)
                session_mgr.upgrade_user(email)

    # When the subscription ends
    elif event["type"] == "customer.subscription.deleted":
        email = stripe.Customer.retrieve(session["customer"]).get("email")
        if email:
            session_mgr.downgrade_user(email)

    return {"Success" : True}

@router.post("/train")
async def train_hook(request: Request, payload: TrainingHookPayload, db: Session = Depends(get_db), x_webhook_signature: Optional[str] = Header(None)):
    if not x_webhook_signature:
        raise HTTPException(status_code=401, detail="Invalid signature")
    raw_payload = await request.body()
    computed_signature = hmac.new(Config.SECRET_KEY.encode(), raw_payload, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(computed_signature, x_webhook_signature):
        raise HTTPException(status_code=401, detail="Invalid signature")
    if payload.status == "benchmark":
        try:
            # Process benchmark data
            Model.update(db, version=payload.model_version, 
                         test_map=payload.metrics.map50,
                         test_mae=payload.metrics.mae,
                         finish_train_date=func.now(),
                         model_url=f"admin/models/yolov9e-{payload.model_version}.pt")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid benchmark payload: {str(e)}")
    elif payload.status == "training":
        try:
            # Process training data
            Model.create(db, run_id=payload.run_id)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid training payload: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="Invalid payload status")