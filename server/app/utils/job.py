import pika
import json
from config import Config

class JobManager:
    def __init__(self, rabbit_host, rabbit_port, rabbit_queue):
        self.rabbit_host = rabbit_host
        self.rabbit_port = rabbit_port
        self.rabbit_queue = rabbit_queue
        self.connection = None
        self.channel = None

    def connect(self, username=Config.RABBIT_MQ_USERNAME, password=Config.RABBIT_MQ_PASSWORD):
        credentials = pika.PlainCredentials(username, password)
        parameters = pika.ConnectionParameters(
            host=self.rabbit_host,
            port=self.rabbit_port,
            credentials=credentials,
            heartbeat=600
        )

        self.connection = pika.BlockingConnection(parameters)
        self.channel = self.connection.channel()
        self.channel.queue_delete(queue=self.rabbit_queue)
        self.channel.queue_declare(queue=self.rabbit_queue, durable=True, arguments={'x-max-priority': 10})

    def close(self):
        if self.connection and self.connection.is_open:
            self.connection.close()

    def submit_inference_job(self, email, folder_id, image_name, path, job_id = None, priority:int = 0):
        job_data = {
            'email': email,
            'folder_id': folder_id,
            'image_name': image_name,
            'path' : path,
            'job_id' : job_id
        }

        job_body = json.dumps(job_data)

        self.channel.basic_publish(
            exchange='',
            routing_key=self.rabbit_queue,
            body=job_body,
            properties=pika.BasicProperties(
                delivery_mode=2,  # make the message persistent
                priority=priority
            )
        )