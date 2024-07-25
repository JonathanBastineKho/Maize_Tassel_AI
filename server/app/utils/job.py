import pika
import json
from config import Config
from google.cloud import run_v2
from google.oauth2 import service_account
import requests
from requests.auth import HTTPBasicAuth 

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
    
    def get_queue_stats(self, username=Config.RABBIT_MQ_USERNAME, password=Config.RABBIT_MQ_PASSWORD):
        # username = 'guest'
        # password = 'guest'
        print(f'{username}, {password}')
        management_port = 15672 
        url = f'http://{self.rabbit_host}:{management_port}/api/queues/%2F/{self.rabbit_queue}'
        response = requests.get(url, auth=HTTPBasicAuth(username, password))
        if response.status_code == 200:
        
            return response.json()
        else: 
            raise Exception(f"{response.status_code}, {response.text}")
    

class CloudRunManager:
    def __init__(self, service_account_path: str = None) -> None:
        self.service_account_path = service_account_path
        if service_account_path:
            credentials = service_account.Credentials.from_service_account_file(
                service_account_path,
                scopes=["https://www.googleapis.com/auth/cloud-platform"]
            )
            self.client = run_v2.JobsClient(credentials=credentials)
        else:
            self.client = run_v2.JobsClient()

    def _get_project_id(self, service_account_path: str):
        with open(service_account_path, 'r') as f:
            sa_info = json.load(f)
        return sa_info["project_id"]

    def run_job(self, location: str, service_name: str, args: list):
        project_id = self._get_project_id(self.service_account_path)
        parent = f"projects/{project_id}/locations/{location}"
        
        job_config = {
            "template": {
                "template": {
                    "containers": [{
                        "image": f"gcr.io/{project_id}/train-model:latest",
                        "args": args,
                        "resources": {
                            "limits": {
                                "cpu": "4",
                                "memory": "16Gi",
                            }
                        }
                    }],
                    # "volumes": [{
                    #     "name": "job-disk",
                    #     "empty_dir": {
                    #         "size_limit": "50Gi"
                    #     }
                    # }],
                },
            },
        }

        try:
            create_job_request = run_v2.CreateJobRequest(
                parent=parent,
                job=job_config,
                job_id=service_name
            )
            
            operation = self.client.create_job(request=create_job_request)
            created_job = operation.result()
            
            run_job_request = run_v2.RunJobRequest(
                name=created_job.name
            )
            
            self.client.run_job(request=run_job_request)

        except Exception as e:
            print(f"An error occurred while running the job: {str(e)}")
            raise