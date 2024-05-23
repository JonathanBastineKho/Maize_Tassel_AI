from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import stripe
from app.database.schema import TypeOfUser, Transaction
from app.database.utils import get_db
from app.utils.payload import LoginRequired, CheckoutSessionRequest

router = APIRouter(tags=["Subscription"], prefix="/subscription")

@router.post("/create-checkout-session")
async def create_checkout_session(request: CheckoutSessionRequest, user: dict = Depends(LoginRequired(roles_required={TypeOfUser.REGULAR}))):
    try:
        if request.is_monthly:
            price_id = "price_1PIW9KRoeifimUyGkLpZrEPM"
        else:
            price_id = "price_1PIW9KRoeifimUyGOtTjhLx9"

        checkout_session = stripe.checkout.Session.create(
            success_url="https://dashboard.stripe.com/test/billing/starter-guide/checkout-success",
            cancel_url="http://localhost:5173/user/subscription",
            payment_method_types=["card"],
            line_items=[{
                "price" : price_id,
                "quantity" : 1
            }],
            mode="subscription",
            customer_email=user['email'],
            client_reference_id=user['email']
        )
        return {"Success" : True, "id" : checkout_session.id}
    except Exception as e:
        raise HTTPException(409, detail=str(e))
    
@router.post("/manage-subscription")
async def manage_subscription(user: dict = Depends(LoginRequired(roles_required={TypeOfUser.PREMIUM}))):
    try:
        # Retrieve the customer ID using the email
        customers = stripe.Customer.list(email=user['email'], limit=1)
        
        if customers:
            customer_id = customers.data[0].id
            
            # Create the billing portal session
            session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url="http://localhost:5173/user/subscription",
            )
            
            return {"url": session.url}
        else:
            raise HTTPException(status_code=404, detail="Customer not found")
    
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/view-subscription")
async def view_subscription(user: dict = Depends(LoginRequired(roles_required={TypeOfUser.PREMIUM, TypeOfUser.REGULAR})), db: Session = Depends(get_db)):
    data = {}

    transactions = db.query(Transaction).filter(Transaction.user_email == user['email']).order_by(Transaction.start_date.desc()).all()
    data["transactions"] = [{"start_date" : tr.start_date, "end_date" : tr.end_date, "amount" : tr.amount, "status" : tr.success} for tr in transactions]
    
    last_transaction = transactions[0] if transactions else None
    data["cancelled"] = last_transaction is not None and not last_transaction.auto_renew
    return data