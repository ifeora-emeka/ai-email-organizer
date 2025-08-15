#!/bin/bash

set -e

echo "🚀 Starting deployment to Fly.io..."

echo "📦 Building application locally..."
npm run build

echo "🔍 Checking if Fly.io app exists..."
if ! fly status > /dev/null 2>&1; then
    echo "🆕 Creating new Fly.io app..."
    fly apps create ai-email-organizer
fi

echo "🐳 Deploying with Docker..."
fly deploy

echo "✅ Deployment complete!"
echo "🌐 Your app should be available at: https://ai-email-organizer.fly.dev"

echo "📊 Checking app status..."
fly status

echo "📝 Recent logs:"
fly logs --limit 50
