from google.cloud import storage
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from PIL import Image as PILImage
from io import BytesIO
import os, datetime, asyncio, json
from typing import List, Union
from app.database.schema import Folder, Image

class StorageManager:
    ROOT="https://storage.cloud.google.com/"

    def __init__(self, bucket_name:str, public_bucket:str) -> None:
        self.client = storage.Client()
        self.private_bucket_name = bucket_name
        self.bucket = self.client.bucket(bucket_name)
        self.public_bucket = self.client.bucket(public_bucket)

    async def upload_profile_pict(self, file: UploadFile, email: str, thumbnail_size:tuple = (256,256)) -> dict:
        if not file:
            raise HTTPException(status_code=400, detail="No file uploaded")

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
                expiration=datetime.timedelta(minutes=15),
                method="GET"
            )

        blobs = [self.bucket.blob(url) for url in urls]
        signed_urls = await asyncio.gather(*[generate_signed_url(blob) for blob in blobs])
        return signed_urls
    
    async def rename_blob_async(self, old_path: str, new_path: str):
        blob = self.bucket.blob(old_path)
        try:
            new_blob = await asyncio.to_thread(self.bucket.rename_blob, blob, new_path)
            return new_blob.name
        except Exception as e:
            print(f"Error renaming {old_path} to {new_path}: {e}")
            return None

    async def rename_image(self, image_path: str, thumbnail_path: str, new_name: str):
        base_name = os.path.basename(image_path)
        image_path_dir = os.path.dirname(image_path)
        thumbnail_path_dir = os.path.dirname(thumbnail_path)
        _, extension = os.path.splitext(base_name)

        new_image_path = f"{image_path_dir}/{new_name}{extension}"
        new_thumbnail_path = f"{thumbnail_path_dir}/{new_name}{extension}"

        rename_tasks = [
            self.rename_blob_async(image_path, new_image_path),
            self.rename_blob_async(thumbnail_path, new_thumbnail_path)
        ]

        results = await asyncio.gather(*rename_tasks)

        return results[0], results[1]
    
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

    async def add_image_to_dataset(self, dataset_name: str, image_name: str, folder_id: str, image_path: str, thumbnail_path: str):
        try:
            destination_path_1 = f"dataset/{dataset_name}/{folder_id}/image/{image_name}"
            destination_path_2 = f"dataset/{dataset_name}/{folder_id}/thumbnail/{image_name}"

            def copy_blob(source_path: str, destination_path: str):
                source_blob = self.bucket.blob(source_path)
                destination_blob = self.bucket.blob(destination_path)
                self.bucket.copy_blob(source_blob, self.bucket, destination_blob.name)
                return destination_path

            loop = asyncio.get_running_loop()
            tasks = [
                loop.run_in_executor(None, copy_blob, image_path, destination_path_1),
                loop.run_in_executor(None, copy_blob, thumbnail_path, destination_path_2)
            ]
            results = await asyncio.gather(*tasks)

            return results[0], results[1]
        except Exception as e:
            print(f"Error in add_image_to_dataset: {str(e)}")

    def export_label_data(self, label_data: dict, export_dir: str = 'temp/labels_export.json'):
        blob = self.bucket.blob(export_dir)
        blob.upload_from_string(json.dumps(label_data))
        return f"gs://{self.private_bucket_name}/{export_dir}"