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