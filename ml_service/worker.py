import pika
import json
import requests
import hashlib
import hmac
import io
import os
from PIL import Image
import tempfile
from google.cloud import storage
from config import Config
from ultralytics import YOLO

class Worker:
    def __init__(self, rabbit_host: str, rabbit_port: int, rabbit_queue: str, update_status_url: str, finish_predict_url: str, model_path: str, bucket_name: str, deployed_model_url: str):
        # Rabbit MQ connection
        self.rabbit_host = rabbit_host
        self.rabbit_port = rabbit_port
        self.rabbit_queue = rabbit_queue
        self.connection = None
        self.channel = None

        # Model update exchange
        self.model_update_exchange = 'model_updates'

        # Webhook connection
        self.update_status_url = update_status_url
        self.finish_predict_url = finish_predict_url
        self.deployed_model_url = deployed_model_url

        # Storage
        self.client = storage.Client()
        self.bucket = self.client.bucket(bucket_name)

        # Model
        self.model_path = model_path
        self.model = self.init_model()

    def init_model(self):
        try:
            # Check if there's a .pt file in the model_path
            pt_files = [f for f in os.listdir(self.model_path) if f.endswith('.pt')]
            
            if pt_files:
                current_model = os.path.join(self.model_path, pt_files[0])
                current_version = int(pt_files[0].split('-')[1].split('.')[0])
            else:
                current_model = None
                current_version = None

            # Get the deployed model version
            payload = b''
            signature = hmac.new(Config.SECRET_KEY.encode(), payload, hashlib.sha256).hexdigest()
            headers = {'X-Webhook-Signature': signature}
            response = requests.get(self.deployed_model_url, headers=headers)

            if response.status_code == 200:
                deployed_version = int(response.json()['version'])

                if current_version != deployed_version:
                    print(f"Updating model from version {current_version} to {deployed_version}")
                    new_model_name = f"yolov9e-{deployed_version}.pt"
                    new_model_path = os.path.join(self.model_path, new_model_name)
                    
                    # Ensure the directory exists
                    os.makedirs(self.model_path, exist_ok=True)
                    
                    # Download the new model
                    self.bucket.blob(os.path.join(self.model_path, new_model_name)).download_to_filename(new_model_path)
                    
                    # Remove the old model file if it exists
                    if current_model and os.path.exists(current_model):
                        os.remove(current_model)
                    
                    return YOLO(new_model_path)
                else:
                    print("Model is up to date")
                    return YOLO(current_model)
            else:
                print("Failed to get deployed model version. Using current model if available.")
                if current_model:
                    return YOLO(current_model)
                else:
                    raise Exception("No model available and failed to get deployed version")
        except Exception as e:
            print(f"Error initializing model: {str(e)}. Unable to proceed.")
            raise

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

        # Setup for model updates
        self.channel.exchange_declare(exchange=self.model_update_exchange, exchange_type='fanout')
        result = self.channel.queue_declare(queue='', exclusive=True)
        self.model_update_queue = result.method.queue
        self.channel.queue_bind(exchange=self.model_update_exchange, queue=self.model_update_queue)

        self.channel.basic_consume(
            queue=self.rabbit_queue,
            on_message_callback=self.process_inference_job,
            # auto_ack=True
        )
        self.channel.basic_qos(prefetch_count=1)
        self.channel.basic_consume(
            queue=self.model_update_queue,
            on_message_callback=self.process_model_update,
            auto_ack=True
        )

    def process_model_update(self, ch, method, properties, body):
        try:
            self.model = self.init_model()
            print("Model updated successfully")
        except Exception as e:
            print(f"Error updating model: {str(e)}")

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
            ch.basic_ack(delivery_tag=method.delivery_tag)
        except:
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
            self.update_job_status(job['email'], job["image_name"], job["folder_id"], "error", job['job_id'])

    def start_consuming(self):
        print(' [*] Waiting for inference jobs. To exit press CTRL+C')
        try:
            self.channel.start_consuming()
        except KeyboardInterrupt:
            self.close()