from google.cloud import storage
from fastapi import UploadFile

class StorageManager:
    def __init__(self, bucket_name:str) -> None:
        self.client = storage.Client()
        self.bucket = self.client.bucket(bucket_name)

    async def upload_maize_image(self, file: UploadFile, email: str):
        contents = await file.read()
        blob = self.bucket.blob(f"{email}/{file.filename}")
        blob.upload_from_string(contents)