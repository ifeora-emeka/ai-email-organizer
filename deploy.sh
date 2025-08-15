#!/bin/bash

set -e

echo "🚀 Starting deployment to Fly.io..."

echo "📦 Building application locally..."
npm run build

# Check if fly app exists, if not create it
if ! fly status > /dev/null 2>&1; then
    echo "🆕 Creating new Fly.io app..."
    fly apps create ai-email-organizer --org personal
fi

echo "🐳 Building and deploying with Docker..."
fly deploy --local-only --dockerfile Dockerfile

echo "✅ Deployment complete!"
echo "🌐 Your app should be available at: https://ai-email-organizer.fly.dev"

echo "📊 Checking app status..."
fly status

echo "📝 Recent logs:"
fly logs --limit 50
