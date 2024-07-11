from config import Config
from .storage import StorageManager
from .session import SessionManager
from .email import EmailSender
from .job import JobManager, CloudRunManager
from .llm import LLMmanager

# initialize session manager
session_mgr = SessionManager()

# Initialize storage manager
storage_mgr = StorageManager(bucket_name=Config.PRIVATE_BUCKET_NAME, 
                             public_bucket=Config.PUBLIC_BUCKET_NAME)

# Initialize Email sender
email_sender = EmailSender()

# Initialize job manager
job_mgr = JobManager(
    rabbit_host="localhost",
    rabbit_port=5672,
    rabbit_queue="inference_job"
)
job_mgr.connect()

# Initialize cloud run manager
cloud_run_mgr = CloudRunManager(service_account_path=Config.GOOGLE_CLOUD_RUN_KEY)

# Initialize LLM Manager
llm_mgr = LLMmanager(credential_path=Config.GOOGLE_APPLICATION_CREDENTIALS, 
                     project_id=Config.GOOGLE_PROJECT_ID)