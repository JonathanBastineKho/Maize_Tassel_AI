from worker import Worker

if __name__ == "__main__":
    worker = Worker(queue_name="job")
    worker.start()