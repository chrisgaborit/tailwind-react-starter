#!/bin/bash

# Step 1: Build the backend
echo "🔨 Building backend..."
npm run build

# Step 2: Submit Docker image to Google Cloud Build
echo "📦 Submitting Docker image to Google Cloud..."
gcloud builds submit --tag gcr.io/genesis-backend-project/genesis-backend

# Step 3: Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy genesis-backend \
  --image gcr.io/genesis-backend-project/genesis-backend \
  --platform managed \
  --region australia-southeast1 \
  --allow-unauthenticated

echo "✅ Deployment complete!"
