from fastapi import APIRouter, UploadFile
from app.utils import storage_mgr

router = APIRouter(tags=["User"], prefix="/user")

@router.post("/count")
async def test(file: UploadFile):
    await storage_mgr.upload_maize_image(file, email="test")
    return {"message": f"File '{file.filename}' uploaded successfully."}
