#!/bin/bash

set -e

echo "🚀 Starting deployment to Fly.io..."

echo "📦 Building application locally..."
npm run build

echo "🐳 Building Docker image..."
docker build -t ai-email-organizer .

echo "🎯 Deploying to Fly.io..."
fly deploy --local-only

echo "✅ Deployment complete!"
echo "🌐 Your app should be available at: https://ai-email-organizer.fly.dev"

echo "📊 Checking app status..."
fly status

echo "📝 Recent logs:"
fly logs --limit 50
