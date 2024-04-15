from fastapi import APIRouter

router = APIRouter(tags=["Guest"], prefix="/api")

@router.get("/test")
def test():
    return {"Success" : True}