import os
import json
import argparse
import shutil
from dotenv import load_dotenv
from google.cloud import storage
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

load_dotenv()

BUCKET_NAME = os.getenv('BUCKET_NAME')
storage_client = storage.Client()
bucket = storage_client.bucket(BUCKET_NAME)

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

        # Perform first split: (train+val) vs test
        train_val_indices, test_indices = train_test_split(
            np.arange(len(image_list)), 
            test_size=test_ratio, 
            stratify=bins, 
            random_state=42
        )
        
        # Get the bins for the train_val set
        train_val_bins = bins[train_val_indices]

        # Reassign single-sample bins again before the second split
        train_val_bins = reassign_single_sample_bins(train_val_bins)

        # Perform second split on train_val: train vs val
        train_indices, val_indices = train_test_split(
            np.arange(len(train_val_indices)), 
            test_size=val_ratio/(train_ratio+val_ratio), 
            stratify=train_val_bins, 
            random_state=42
        )

        # Convert back to original indices
        train_indices = train_val_indices[train_indices]
        val_indices = train_val_indices[val_indices]

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
    # Download model and labels
    download_from_gcs(blob_name=f"admin/models/yolov9e-{args.base_model_version}.pt", 
                      destination=f"yolov9e-{args.base_model_version}.pt", log=True)
    download_from_gcs(blob_name=args.label_path, destination=os.path.basename(args.label_path), log=True)

    # Download images in the dataset
    download_dataset_images(args.dataset_names)

    # Splitting dataset
    dataset_bins = json.loads(args.dataset_bins)
    with open(os.path.basename(args.label_path), 'r') as f:
        label_data = json.load(f)
    prepare_yolo_data(label_data, 'datasets', dataset_bins, args.train_ratio, args.val_ratio, args.test_ratio)
    shutil.rmtree('temp', ignore_errors=True)

    # Train the model
    

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

    # Dataset ratio
    parser.add_argument("--train_ratio", type=float, default=0.64, help="Ratio of training data")
    parser.add_argument("--val_ratio", type=float, default=0.16, help="Ratio of validation data")
    parser.add_argument("--test_ratio", type=float, default=0.2, help="Ratio of test data")
    parser.add_argument("--dataset_bins", type=str, default='{}',
                        help='JSON string specifying bins for each dataset, e.g., \'{"dataset1": 5, "dataset2": 7}\'')
    main(parser.parse_args())