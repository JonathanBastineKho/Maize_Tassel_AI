import os
import json
import argparse
import shutil
import yaml
import uuid
from dotenv import load_dotenv
load_dotenv()
from google.cloud import storage
import numpy as np
import pandas as pd
import wandb
import nbformat as nbf
import time
from ultralytics import YOLO
from wandb.integration.ultralytics import add_wandb_callback
from sklearn.model_selection import train_test_split
from kaggle.api.kaggle_api_extended import KaggleApi

# Preliminary Setup
BUCKET_NAME = os.getenv('BUCKET_NAME')
storage_client = storage.Client()
bucket = storage_client.bucket(BUCKET_NAME)

kaggle = KaggleApi()
kaggle.authenticate()

def download_from_gcs(blob_name: str, destination: str, log: bool = False):
    """Downloads a blob from the GCS bucket."""
    blob = bucket.blob(blob_name)
    blob.download_to_filename(destination)
    if log:
        print(f"Downloaded {blob_name} to {destination}")

def create_bins(labels, n_bins):
    """Create bins using pandas.cut"""
    box_counts = np.array([len(labels[img]) for img in labels])
    bins, bin_edges = pd.cut(box_counts, bins=n_bins, retbins=True, labels=False)
    
    return bins, bin_edges.tolist()

def reassign_single_sample_bins(bins):
    unique_bins, counts = np.unique(bins, return_counts=True)
    single_sample_bins = unique_bins[counts == 1]
    
    if len(single_sample_bins) > 0:
        for single_bin in single_sample_bins:
            # Find the nearest non-single-sample bin
            other_bins = unique_bins[counts > 1]
            if len(other_bins) > 0:
                nearest_bin = other_bins[np.abs(other_bins - single_bin).argmin()]
                bins[bins == single_bin] = nearest_bin
            else:
                # If all bins have single samples, merge with the nearest bin
                nearest_bin = unique_bins[np.abs(unique_bins - single_bin).argmin()]
                if nearest_bin != single_bin:
                    bins[bins == single_bin] = nearest_bin
    
    return bins

def download_dataset_images(dataset_names):
    temp_dir = 'temp'
    os.makedirs(temp_dir, exist_ok=True)
    
    for dataset_name in dataset_names:
        print(f"Downloading images for dataset: {dataset_name}")
        blobs = bucket.list_blobs(prefix=f"dataset/{dataset_name}/")
        for blob in blobs:
            if (blob.name.endswith('.jpg') or blob.name.endswith('.png')) and '/image/' in blob.name:
                # Extract folder_id and image_name from the blob path
                _, folder_id, _, image_name = blob.name.split('/')[-4:]
                temp_image_name = f"{dataset_name}_{folder_id}_{image_name}"
                local_path = os.path.join(temp_dir, temp_image_name)
                
                if not os.path.exists(local_path):
                    blob.download_to_filename(local_path)
                    print(f"Downloaded: {temp_image_name}")
                else:
                    print(f"Skipped (already exists): {temp_image_name}")
        
        print(f"Finished downloading images for dataset: {dataset_name}")

def create_dataset_yaml(output_dir: str, nc: int = 1, names: list = ['tsl'], dataset_slug: str = ''):
    """
    Creates a YAML file for Ultralytics training.
    """
    yaml_content = {
        'path': f'/kaggle/input/{dataset_slug}',  # Dataset root dir
        'train': 'images/train',  # Train images (relative to 'path')
        'val': 'images/val',      # Val images (relative to 'path')
        'test': 'images/test',    # Test images (optional)
        'names': {i: name for i, name in enumerate(names)}  # Class names
    }

    yaml_path = os.path.join(output_dir, 'dataset.yaml')
    with open(yaml_path, 'w') as f:
        yaml.dump(yaml_content, f, default_flow_style=False)
    
    print(f"Created dataset YAML at {yaml_path}")
    return yaml_path

def poll_for_dataset(dataset_name, max_attempts=30, delay=5):
    print(f"Waiting for dataset {dataset_name} to appear in the list...")
    for attempt in range(max_attempts):
        datasets = kaggle.dataset_list(mine=True)
        if any(dataset.ref == dataset_name for dataset in datasets):
            print(f"Dataset {dataset_name} found after {attempt + 1} attempts.")
            return True
        print(f"Attempt {attempt + 1}/{max_attempts}: Dataset not found. Waiting {delay} seconds...")
        time.sleep(delay)
    print(f"Dataset {dataset_name} not found after {max_attempts} attempts.")
    return False

def upload_to_kaggle(dataset_path: str, dataset_slug: str):
    full_dataset_name = f"{os.environ.get('KAGGLE_USERNAME')}/{dataset_slug}"
    metadata_file = os.path.join(dataset_path, 'dataset-metadata.json')
    if not os.path.exists(metadata_file):
        metadata = {
            "title": dataset_slug,
            "id": full_dataset_name,
            "licenses": [{"name": "CC0-1.0"}]
        }
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f)
    kaggle.dataset_create_new(folder=dataset_path, public=False, dir_mode='zip', convert_to_csv=False)
    print(f"Uploaded dataset to Kaggle: {full_dataset_name}")
    return full_dataset_name

def run_kaggle_notebook(dataset_name: str, model_blob_name: str, yaml_path: str, gpu: bool, args):
    private_key_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    with open(private_key_path, 'r') as f:
        private_key_json = json.load(f)
    notebook_content = f"""
import os
import sys
import subprocess

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

install('ultralytics')
install('wandb==0.16.6')
install('google-cloud-storage')

import wandb
from ultralytics import YOLO
from wandb.integration.ultralytics import add_wandb_callback
from google.cloud import storage
from google.oauth2 import service_account

# Print current working directory and its contents
print('Current working directory:')
print(os.getcwd())
print('Contents of current directory:')
print(os.listdir())

# Set up Google Cloud credentials
credentials_json = {private_key_json}
credentials = service_account.Credentials.from_service_account_info(credentials_json)

# Download model from Google Cloud Storage
storage_client = storage.Client(credentials=credentials)
bucket = storage_client.bucket('{BUCKET_NAME}')
blob = bucket.blob('{model_blob_name}')
blob.download_to_filename('model.pt')

wandb.login(key="{os.getenv('WANDB_API_KEY')}")

model = YOLO("model.pt")
add_wandb_callback(model, enable_model_checkpointing=True)

model.train(
    data="{yaml_path}",
    epochs={args.epochs},
    patience={args.patience},
    batch={args.batch},
    imgsz={args.imgsz},
    dropout={args.dropout},
    freeze={args.freeze},
    optimizer="{args.optimizer}",
    lr0={args.learning_rate},
    single_cls=True,
    project="fyp",
    name="Active Learning v{args.base_model_version}"
)

wandb.finish()
    """
    notebook_id = uuid.uuid4()
    notebook_metadata = {
        "id": f"{os.environ.get('KAGGLE_USERNAME')}/{args.base_model_version}{notebook_id}",
        "title": f"v{args.base_model_version}{notebook_id}",
        "language": "python",
        "kernel_type": "notebook",
        "is_private": True,
        "enable_gpu": gpu,
        "enable_internet": True,
        "dataset_sources": [dataset_name],
        "kernel_sources": [],
        "competition_sources": [],
        "code_file" : "notebook.ipynb"
    }

    # Create a temporary directory for the kernel
    kernel_dir = 'kaggle_kernel'
    os.makedirs(kernel_dir, exist_ok=True)

    with open(os.path.join(kernel_dir, 'kernel-metadata.json'), 'w') as f:
        json.dump(notebook_metadata, f)

    # Save the notebook content
    nb = nbf.v4.new_notebook()
    code_cell = nbf.v4.new_code_cell(notebook_content)
    nb['metadata'] = {
        "kernelspec": {
            "display_name": "Python 3",
            "language": "python",
            "name": "python3"
        },
        "language_info": {
            "codemirror_mode": {
                "name": "ipython",
                "version": 3
            },
            "file_extension": ".py",
            "mimetype": "text/x-python",
            "name": "python",
            "nbconvert_exporter": "python",
            "pygments_lexer": "ipython3",
            "version": "3.10.0"
        }
    }
    nb['cells'] = [code_cell]
    with open(os.path.join(kernel_dir, 'notebook.ipynb'), 'w', encoding='utf-8') as f:
        nbf.write(nb, f)

    kaggle.kernels_push_cli(kernel_dir)
    print("Submitted training job to Kaggle")

    # Clean up the temporary directory
    shutil.rmtree(kernel_dir)

def prepare_yolo_data(label_data: dict, output_dir: str, dataset_bins: dict, train_ratio=0.64, val_ratio=0.16, test_ratio=0.2):
    """Prepares YOLO format labels from the exported nested label data with stratified splitting."""
    assert np.isclose(train_ratio + val_ratio + test_ratio, 1.0), "Ratios must sum to 1"

    os.makedirs(output_dir, exist_ok=True)
    for split in ['train', 'val', 'test']:
        os.makedirs(os.path.join(output_dir, 'labels', split), exist_ok=True)
        os.makedirs(os.path.join(output_dir, 'images', split), exist_ok=True)

    for dataset_name, images in label_data.items():
        # Get number of bins for this dataset, or use default if not specified
        image_list = list(images.keys())
        n_bins = dataset_bins.get(dataset_name, 5)
        bins, bin_edges = create_bins(images, n_bins)

        # Reassign single-sample bins before the first split
        bins = reassign_single_sample_bins(bins)

        # Check if we have enough samples for stratification
        unique_bins = np.unique(bins)
        if len(image_list)*test_ratio >= len(unique_bins) and len(image_list)*train_ratio*val_ratio >= len(unique_bins) :
            # Perform stratified split
            train_val_indices, test_indices = train_test_split(
                np.arange(len(image_list)), 
                test_size=test_ratio, 
                stratify=bins, 
                random_state=42
            )
            
            train_val_bins = bins[train_val_indices]
            train_val_bins = reassign_single_sample_bins(train_val_bins)

            train_indices, val_indices = train_test_split(
                np.arange(len(train_val_indices)), 
                test_size=val_ratio/(train_ratio+val_ratio), 
                stratify=train_val_bins, 
                random_state=42
            )

            # Convert back to original indices
            train_indices = train_val_indices[train_indices]
            val_indices = train_val_indices[val_indices]
        else:
            print(f"Warning: Not enough samples for stratified split in dataset {dataset_name}. Falling back to random split.")
            train_val_indices, test_indices = train_test_split(
                np.arange(len(image_list)), 
                test_size=test_ratio, 
                random_state=42
            )
            train_indices, val_indices = train_test_split(
                train_val_indices,
                test_size=val_ratio/(train_ratio+val_ratio), 
                random_state=42
            )

        # Now process the split data
        split_indices = {
            'train': train_indices,
            'val': val_indices,
            'test': test_indices
        }
        for split, indices in split_indices.items():
            for idx in indices:
                image_path = image_list[idx]
                labels = images[image_path]
                folder_id, _, image_name = image_path.split('/')
                
                # Create label file
                label_file = os.path.join(output_dir, 'labels', split, f"{dataset_name}_{folder_id}_{image_name.replace('.jpg', '.txt')}")
                os.makedirs(os.path.dirname(label_file), exist_ok=True)
                with open(label_file, 'w') as f:
                    for label in labels:
                        f.write(f"0 {label['xCenter']} {label['yCenter']} {label['width']} {label['height']}\n")
                
                # Move image from temp to final location
                temp_image_path = os.path.join('temp', f"{dataset_name}_{folder_id}_{image_name}")
                final_image_path = os.path.join(output_dir, 'images', split, f"{dataset_name}_{folder_id}_{image_name}")
                os.makedirs(os.path.dirname(final_image_path), exist_ok=True)
                if os.path.exists(temp_image_path):
                    shutil.move(temp_image_path, final_image_path)
                else:
                    print(f"Warning: Image not found in temp directory: {temp_image_path}")

    print("Data preparation completed.")

def main(args):
    # labels
    download_from_gcs(blob_name=args.label_path, destination=os.path.basename(args.label_path), log=True)

    # Download images in the dataset
    download_dataset_images(args.dataset_names)
    
    # Splitting dataset
    dataset_bins = json.loads(args.dataset_bins)
    with open(os.path.basename(args.label_path), 'r') as f:
        label_data = json.load(f)
    prepare_yolo_data(label_data, 'datasets', dataset_bins, args.train_ratio, args.val_ratio, args.test_ratio)
    shutil.rmtree('temp', ignore_errors=True)
    dataset_slug = f"{args.base_model_version}-{str(uuid.uuid4())[:-4]}"
    dataset_path = 'datasets'
    create_dataset_yaml(dataset_path, dataset_slug=dataset_slug)

    # Train the model
    full_dataset_name = upload_to_kaggle(dataset_path, dataset_slug)

    # Poll for the dataset to appear in the list
    dataset_ready = poll_for_dataset(full_dataset_name)
    
    if dataset_ready:
        print("Dataset is ready. Proceeding with notebook creation.")
        model_blob_name = f"admin/models/yolov9e-{args.base_model_version}.pt"
        run_kaggle_notebook(full_dataset_name, model_blob_name, f'/kaggle/input/{dataset_slug}/dataset.yaml', args.gpu, args)
    else:
        print("Dataset not ready. Please check your Kaggle account and try again later.")
        return

    print("Training job submitted to Kaggle.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train YOLO model")

    # Preliminary thing to download
    parser.add_argument("--dataset_names", nargs='+', required=True, help="List of dataset names")
    parser.add_argument("--base_model_version", type=int, required=True, help="Base model version")
    parser.add_argument("--label_path", type=str, default="temp/labels_export.json", help="Label path")

    # Hyper parameters
    parser.add_argument("--epochs", type=int, default=100, help="Number of epochs")
    parser.add_argument("--patience", type=int, default=10, help="Number of Patience")
    parser.add_argument("--batch", type=int, default=16, help="Batch size")
    parser.add_argument("--imgsz", type=int, default=860, help="Image size")
    parser.add_argument("--dropout", type=float, default=0.1, help="Dropout ratio")
    parser.add_argument("--freeze", type=float, default=10, help="Number of layers to be frozen")
    parser.add_argument("--optimizer", type=str, default="Adam", help="Optimizer (SGD, Adam, AdamW, RMSProp)")
    parser.add_argument("--learning_rate", type=float, default=0.001, help="Initial learning rate")

    # Dataset ratio
    parser.add_argument("--train_ratio", type=float, default=0.64, help="Ratio of training data")
    parser.add_argument("--val_ratio", type=float, default=0.16, help="Ratio of validation data")
    parser.add_argument("--test_ratio", type=float, default=0.2, help="Ratio of test data")
    parser.add_argument("--dataset_bins", type=str, default='{}',
                        help='JSON string specifying bins for each dataset, e.g., \'{"dataset1": 5, "dataset2": 7}\'')
    
    parser.add_argument('--gpu', action='store_true', help='Use GPU if this flag is set')
    main(parser.parse_args())