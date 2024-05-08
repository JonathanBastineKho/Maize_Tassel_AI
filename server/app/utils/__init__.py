from config import Config
from .storage import StorageManager
from .session import SessionManager
from .email import EmailSender
from .job import JobManager

# initialize session manager
session_mgr = SessionManager()

# Initialize storage manager
storage_mgr = StorageManager(bucket_name=Config.PRIVATE_BUCKET_NAME)

# Initialize Email sender
email_sender = EmailSender()

# Initialize job manager
job_mgr = JobManager(
    rabbit_host="localhost",
    rabbit_port=5672,
    rabbit_queue="inference_job"
)
job_mgr.connect()