from google.cloud import storage
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from PIL import Image as PILImage
from io import BytesIO
import os, datetime, asyncio
from typing import List, Union
from app.database.schema import Folder, Image

class StorageManager:
    ROOT="https://storage.cloud.google.com/"

    def __init__(self, bucket_name:str, public_bucket:str) -> None:
        self.client = storage.Client()
        self.bucket = self.client.bucket(bucket_name)
        self.public_bucket = self.client.bucket(public_bucket)

    async def upload_profile_pict(self, file: UploadFile, email: str, thumbnail_size:tuple = (256,256)) -> dict:
        # Check if image is valid
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in set({".jpg", ".jpeg", ".png"}):
            raise HTTPException(status_code=400, detail="Image must be jpg or png")
        
        contents = await file.read()
        
        # Compress image
        image = PILImage.open(BytesIO(contents))
        image.thumbnail(thumbnail_size)
        if image.mode == "RGBA":
            background = PILImage.new("RGB", image.size, (255, 255, 255))
            background.paste(image, mask=image.split()[3])
            image = background

        thumbnail_bytes = BytesIO()
        image.save(thumbnail_bytes, format='JPEG')
        thumbnail_bytes.seek(0)
        thumbnail_bytes_data = thumbnail_bytes.getvalue()
        # Upload actual image
        file_extension = os.path.splitext(file.filename)[1].lower()
        image_path = f"profile/{email}.jpg"
        blob = self.public_bucket.blob(image_path)
        blob.upload_from_string(thumbnail_bytes_data, content_type="image/jpeg")

        return {
            "image_path" : image_path
        }

    async def upload_image(self, file: UploadFile, name: str, email: str, folder_name: str, db:Session, thumbnail_size:tuple = (128,128)) -> dict:
        """
        Upload the image and thumbnail to the google cloud.

        Args:
            file (UploadFile): The uploaded image file.
            email (str): The email associated with the image.
            folder (str): The folder where the image will be stored.
            thumbnail_size (tuple[int, int], optional): The desired size of the thumbnail image. Defaults to (128, 128).
        """
        # Check if image is valid
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in set({".jpg", ".jpeg", ".png"}):
            raise HTTPException(status_code=400, detail="Image must be jpg or png")
        
        # Check if folder is valid
        folder = db.query(Folder).filter(Folder.id == folder_name).one_or_none()
        if not folder:
            raise HTTPException(status_code=400, detail="Folder does not exist")

        # Check if there is a same name in the folder
        if db.query(Image).filter(Image.folder_id == folder.id, Image.name == name).one_or_none():
            raise HTTPException(status_code=409, detail="An image with the same name already exists in this folder.")
        
        contents = await file.read()

        # Upload actual image
        file_extension = os.path.splitext(file.filename)[1].lower()
        content_type = "image/jpeg" if file_extension in [".jpg", ".jpeg"] else "image/png"
        image_path = f"{email}/{folder_name}/image/{name}{file_extension}"
        blob = self.bucket.blob(image_path)
        blob.upload_from_string(contents, content_type=content_type)

        # Get width, height, and size of the image
        image = PILImage.open(BytesIO(contents))
        width, height = image.size
        size = len(contents)

        # Upload thumbnail
        image = PILImage.open(BytesIO(contents))
        image.thumbnail(thumbnail_size)
        if image.mode == "RGBA":
            background = PILImage.new("RGB", image.size, (255, 255, 255))
            background.paste(image, mask=image.split()[3])
            image = background

        thumbnail_bytes = BytesIO()
        image.save(thumbnail_bytes, format='JPEG')
        thumbnail_bytes.seek(0)
        thumbnail_path = f"{email}/{folder_name}/thumbnail/{name}{file_extension}"
        blob = self.bucket.blob(thumbnail_path)
        blob.upload_from_file(thumbnail_bytes, content_type=content_type)

        return {
            "image_path" : image_path,
            "thumbnail_path" : thumbnail_path,
            "width": width,
            "height": height,
            "size": size
        }
    
    async def get_image(self, urls: Union[str, List[str]]) -> List[str]:
        if isinstance(urls, str):
            urls = [urls]
        async def generate_signed_url(blob):
            return blob.generate_signed_url(
                version="v4",
                expiration=datetime.timedelta(minutes=1),
                method="GET"
            )

        blobs = [self.bucket.blob(url) for url in urls]
        signed_urls = await asyncio.gather(*[generate_signed_url(blob) for blob in blobs])
        return signed_urls
    
    async def delete_image(self, urls: Union[str, List[str]]):
        if isinstance(urls, str):
            urls = [urls]

        blobs = []
        for url in urls:
            blobs.append(self.bucket.blob(url))
            thumbnail_url = url.replace("/image/", "/thumbnail/")
            blobs.append(self.bucket.blob(thumbnail_url))

        for blob in blobs:
            try:
                blob.delete()
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to delete image: {e}")
    
    async def download_image(self, path) -> bytes:
        blob = self.bucket.blob(path)
        if not blob.exists():
            raise HTTPException(status_code=404, detail="Image not found")
        return blob.download_as_bytes()
    
    def delete_folder(self, folder_path: str):
        blobs = list(self.bucket.list_blobs(prefix=folder_path))
        try:
            self.bucket.delete_blobs(blobs)
        except Exception as e:
            print(e)
            pass