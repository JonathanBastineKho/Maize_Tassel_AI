from config import Config
from .storage import StorageManager
from .session import SessionManager
from .email import EmailSender

# initialize session manager
session_mgr = SessionManager()

# Initialize storage manager
storage_mgr = StorageManager(bucket_name=Config.PRIVATE_BUCKET_NAME)

# Initialize Email sender
email_sender = EmailSender()