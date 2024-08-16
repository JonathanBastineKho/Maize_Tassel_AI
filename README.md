# Maize_Tassel_AI

# Web Application Installation Guide

This repository contains a web application with a React frontend, Python backend, and a machine learning service. Follow these instructions to set up and run the application.

## Prerequisites

Before proceeding with the installation, ensure you have the following prerequisites installed on your system:

- **Python 3.10**: Required for the backend and machine learning service.
- **Docker**: Used for running Redis and RabbitMQ. Docker Desktop is recommended.
- **Node.js**: Required for the React frontend.
- **Conda (Optional)**: For managing Python dependencies in a separate environment.
- **Google Cloud Account**: Required for storing static images on Google Cloud Storage.
- **Stripe CLI (Optional)**: For working on payment processing functionality during development.

## Setting up Docker Containers

Run Redis and RabbitMQ as Docker containers using the following commands:

```bash
# Run Redis
docker run -d --name redis-stack -p 6379:6379 redis/redis-stack:latest

# Run RabbitMQ
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

## Installation

### 1. Client (Frontend) Installation

```bash
cd client
npm install
```

### 2. Server (Backend) Installation

```bash
cd server
pip install -r requirements.txt
```

### 3. Machine Learning Service Installation

```bash
cd ml_service
pip install -r requirements.txt
```

## Starting the Services

### Client (Frontend)

```bash
cd client
npm run dev
```

### Server (Backend)

```bash
cd server
python3 application.py
```

### Machine Learning Service

```bash
cd ml_service
python3 main.py
```

### Stripe CLI (Optional)

If working on payment processing functionality:

```bash
stripe listen --forward-to localhost:8000/api/hook/stripe
```

## Additional Configuration

Ensure that you have set up the necessary environment variables and configurations, especially for Google Cloud Storage and Stripe integration.
