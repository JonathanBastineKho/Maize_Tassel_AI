import pika
import json
import requests
import hashlib
import hmac
import io
from PIL import Image
import tempfile
from google.cloud import storage
from config import Config
from ultralytics import YOLO

class Worker:
    def __init__(self, rabbit_host: str, rabbit_port: int, rabbit_queue: str, update_status_url: str, finish_predict_url: str, model_url: str, bucket_name: str):
        # Rabbit MQ connection
        self.rabbit_host = rabbit_host
        self.rabbit_port = rabbit_port
        self.rabbit_queue = rabbit_queue
        self.connection = None
        self.channel = None

        # Webhook connection
        self.update_status_url = update_status_url
        self.finish_predict_url = finish_predict_url

        # Storage
        self.client = storage.Client()
        self.bucket = self.client.bucket(bucket_name)

        # Model
        self.model = self.init_model(model_url=model_url)

    def init_model(self, model_url:str):
        model = self.bucket.blob(model_url).download_as_bytes()
        with tempfile.NamedTemporaryFile(delete=True, suffix='.pt') as tmp_file:
            tmp_file.write(model)
            return YOLO(tmp_file.name)

    def connect(self):
        credentials = pika.PlainCredentials('worker', 'maizetasselai')
        parameters = pika.ConnectionParameters(
            host=self.rabbit_host,
            port=self.rabbit_port,
            credentials=credentials
        )

        self.connection = pika.BlockingConnection(parameters)
        self.channel = self.connection.channel()
        self.channel.queue_declare(queue=self.rabbit_queue, durable=True, arguments={'x-max-priority': 10})
        self.channel.basic_consume(
            queue=self.rabbit_queue,
            on_message_callback=self.process_inference_job,
            auto_ack=True
        )
        self.channel.basic_qos(prefetch_count=1)

    def close(self):
        if self.connection and self.connection.is_open:
            self.connection.close()

    def generate_signature(self, payload):
        signature_payload = json.dumps({'name': payload['name'],
                             'folder_id': payload['folder_id']})
        return hmac.new(Config.SECRET_KEY.encode('utf-8'), signature_payload.encode('utf-8'), hashlib.sha256).hexdigest()

    def update_job_status(self, email: str, image_name: str, folder_id: str, status: str, job_id: str):
        data = {
            'email' : email,
            'name': image_name,
            'folder_id': folder_id,
            'job_status': status,
            'job_id' : job_id
        }
        headers = {'signature': self.generate_signature(data)}
        requests.patch(self.update_status_url, json=data, headers=headers)

    def process_inference_job(self, ch, method, properties, body):
        job = json.loads(body)
        print(f"Received inference job for image {job['image_name']} in folder {job['folder_id']}")

        # change the status of the job
        self.update_job_status(job['email'], job["image_name"], job["folder_id"], "processing", job['job_id'])

        # Perform inference tasks
        try:
            image = self.bucket.blob(job['path']).download_as_bytes()
            image = Image.open(io.BytesIO(image))
            results = self.model(image)

            # Process the bounding boxes
            bounding_boxes = []
            for box in results[0].boxes:
                bounding_boxes.append({
                    'xCenter': round(box.xywh[0][0].item()),
                    'yCenter': round(box.xywh[0][1].item()),
                    'width': round(box.xywh[0][2].item()),
                    'height': round(box.xywh[0][3].item()),
                    'confidence': box.conf[0].item()
                })

            # Sending predictions:
            data = {
                'name': job["image_name"],
                'folder_id': job["folder_id"],
                'box' : bounding_boxes,
                'job_id' : job["job_id"],
                'email' : job['email']
            }
            headers = {'signature': self.generate_signature(data)}
            requests.post(self.finish_predict_url, json=data, headers=headers)
        except:
            self.update_job_status(job['email'], job["image_name"], job["folder_id"], "error", job['job_id'])

    def start_consuming(self):
        print(' [*] Waiting for inference jobs. To exit press CTRL+C')
        try:
            self.channel.start_consuming()
        except KeyboardInterrupt:
            self.close()