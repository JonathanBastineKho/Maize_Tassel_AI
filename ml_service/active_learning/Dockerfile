# Use Python 3.10 as the base image
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY . /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 80

ENTRYPOINT ["python", "train.py"]