import os
import argparse
from google.cloud import storage

BUCKET_NAME = "corn_sight_private"
storage_client = storage.Client()
bucket = storage_client.bucket(BUCKET_NAME)


def download_from_gcs(blob_name: str, destination: str, log: bool = False):
    """Downloads a blob from the GCS bucket."""
    blob = bucket.blob(blob_name)
    blob.download_to_filename(destination)
    if log:
        print(f"Downloaded {blob_name} to {destination}")

def main(args):
    # Download model and labels
    download_from_gcs(blob_name=f"admin/models/yolov9e-{args.base_model_version}.pt", 
                      destination=f"yolov9e-{args.base_model_version}.pt")
    download_from_gcs(blob_name=args.label_path, destination=os.path.basename(args.label_path))

    # Download images for all the datasets
    


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train YOLO model")

    # Preliminary thing to download
    parser.add_argument("--dataset_names", nargs='+', required=True, help="List of dataset names")
    parser.add_argument("--base_model_version", type=int, required=True, help="Base model version")
    parser.add_argument("--label_path", type=str, default="admin/temp/labels_export.json", help="Label path")

    # Hyper parameters
    parser.add_argument("--epochs", type=int, default=100, help="Number of epochs")
    parser.add_argument("--patience", type=int, default=10, help="Number of Patience")
    parser.add_argument("--batch", type=int, default=16, help="Batch size")
    parser.add_argument("--imgsz", type=int, default=860, help="Image size")
    parser.add_argument("--dropout", type=float, default=0.1, help="Dropout ratio")
    parser.add_argument("--freeze", type=float, default=10, help="Number of layers to be frozen")
    parser.add_argument("--optimizer", type=str, default="Adam", help="Optimizer (SGD, Adam, AdamW, RMSProp)")

    # Dataset ratio
    parser.add_argument("--train_ratio", type=float, default=0.8, help="Ratio of training data")
    parser.add_argument("--val_ratio", type=float, default=0.1, help="Ratio of validation data")
    parser.add_argument("--test_ratio", type=float, default=0.1, help="Ratio of test data")