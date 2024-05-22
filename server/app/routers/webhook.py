from fastapi import APIRouter, Depends, Header, HTTPException, Request
import json
import hmac
import hashlib
import stripe
from datetime import timezone, datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from config import Config
from app.database.utils import get_db
from app.database.schema import Image, Prediction, Transaction, TypeOfImageStatus, User, TypeOfUser
from app.utils.payload import JobStatus, JobPrediction
from app.utils import session_mgr

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
            latest_transaction = db.query(Transaction).\
                filter(Transaction.user_email == email).\
                order_by(Transaction.start_date.desc()).\
                first()
            if latest_transaction:
                latest_transaction.auto_renew = False
                db.commit()

        # When user subscribes or renews the subscription
        elif not cancel_at_period_end and session.get("status") == "active":
            latest_transaction = db.query(Transaction).\
                filter(Transaction.user_email == email).\
                order_by(Transaction.start_date.desc()).\
                first()

            if latest_transaction:
                # Renewal
                latest_transaction.auto_renew = True
                db.commit()
            else:
                # New subscription
                new_transaction = Transaction(
                    transaction_id=session["id"],
                    user_email=email,
                    start_date=datetime.fromtimestamp(session["current_period_start"], tz=timezone.utc),
                    end_date=datetime.fromtimestamp(session["current_period_end"], tz=timezone.utc),
                    currency=session["plan"]["currency"],
                    amount=session["plan"]["amount"] / 100
                )
                db.add(new_transaction)
                user = db.query(User).filter(User.email == email).one_or_none()
                user.role = TypeOfUser.PREMIUM
                db.commit()
                session_mgr.upgrade_user(email)

    # When the subscription ends
    elif event["type"] == "customer.subscription.deleted":
        email = stripe.Customer.retrieve(session["customer"]).get("email")
        if email:
            session_mgr.downgrade_user(email)

    return {"Success" : True}