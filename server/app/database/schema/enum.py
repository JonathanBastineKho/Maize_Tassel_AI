from sqlalchemy import Enum

class TypeOfUser(Enum):
    ADMIN = 'admin'
    REGULAR = 'regular'
    PREMIUM = 'premium'

class TypeOfImageStatus(Enum):
    IN_QUEUE = "in_queue"
    PROCESSING = "processing"
    DONE = "done"
    ERROR = "error"
    
class SuspensionCategory(Enum):
    VIOLATIONS = "Violations of Terms and Conditions"
    COPYRIGHT_INFRINGEMENT = "Copyright Infringement"
    ABUSE_OF_SERVICE = "Abuse of Service"
    SECURITY_VIOLATIONS = "Security Violations"
