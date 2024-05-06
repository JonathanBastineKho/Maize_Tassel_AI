from google.cloud import storage
from fastapi import UploadFile
from PIL import Image as PILImage
from io import BytesIO
import os

class StorageManager:
    ROOT="https://storage.cloud.google.com/"

    def __init__(self, bucket_name:str) -> None:
        self.client = storage.Client()
        self.bucket = self.client.bucket(bucket_name)

    async def upload_image(self, file: UploadFile, email: str, folder: str, thumbnail_size:tuple = (128,128)) -> dict:
        """
        Upload the image and thumbnail to the google cloud.

        Args:
            file (UploadFile): The uploaded image file.
            email (str): The email associated with the image.
            folder (str): The folder where the image will be stored.
            thumbnail_size (tuple[int, int], optional): The desired size of the thumbnail image. Defaults to (128, 128).
        """
        contents = await file.read()

        # Upload actual image
        file_extension = os.path.splitext(file.filename)[1].lower()
        content_type = "image/jpeg" if file_extension in [".jpg", ".jpeg"] else "image/png"
        image_path = f"{email}/{folder}/image/{file.filename}"
        blob = self.bucket.blob(image_path)
        blob.upload_from_string(contents, content_type=content_type)

        # Get width, height, and size of the image
        image = PILImage.open(BytesIO(contents))
        width, height = image.size
        size = len(contents)

        # Upload thumbnail
        image = PILImage.open(BytesIO(contents))
        image.thumbnail(thumbnail_size)
        thumbnail_bytes = BytesIO()
        image.save(thumbnail_bytes, format='JPEG')
        thumbnail_bytes.seek(0)
        thumbnail_name = os.path.splitext(file.filename)[0]
        thumbnail_path = f"{email}/{folder}/thumbnail/{thumbnail_name}.jpg"
        blob = self.bucket.blob(thumbnail_path)
        blob.upload_from_file(thumbnail_bytes, content_type="image/jpeg")

        return {
            "image_path" : image_path,
            "thumbnail_path" : thumbnail_path,
            "width": width,
            "height": height,
            "size": size
        }