from worker import Worker
from config import Config

if __name__ == "__main__":
    worker = Worker(
        rabbit_host=Config.RABBIT_HOST,
        rabbit_port=Config.RABBIT_PORT,
        rabbit_queue=Config.RABBIT_QUEUE,
        update_status_url=Config.UPDATE_STATUS_URL,
        finish_predict_url=Config.FINISH_PREDICT_URL,
        model_url=Config.MODEL_URL,
        bucket_name=Config.PRIVATE_BUCKET_NAME
    )
    worker.connect()
    worker.start_consuming()