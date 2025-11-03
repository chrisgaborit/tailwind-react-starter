#!/bin/bash

# 🚀 Deploy backend to Google Cloud Run

# Set project ID and service name
PROJECT_ID="genesis-backend-project"
SERVICE_NAME="genesis-backend"
REGION="australia-southeast1"

# 1. Submit Docker image to Google Container Registry
echo "🛠️ Building Docker image and submitting to Google Cloud..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME

# 2. Deploy image to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated

echo "✅ Deployment complete!"
