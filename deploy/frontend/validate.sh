#!/bin/bash

echo "🔍 Validating frontend deployment setup..."

cd "$(dirname "$0")"/../..

required_files=(
    "deploy/frontend/fly.toml"
    "deploy/frontend/Dockerfile"
    "deploy/frontend/deploy.sh"
    "deploy/frontend/deploy.bat"
    "deploy/frontend/README.md"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

echo ""
echo "📋 Deployment commands available:"
echo "  npm run deploy:frontend:prepare - Prepare frontend for deployment"
echo "  npm run deploy:frontend - Full frontend deployment"
echo "  npm run deploy:backend - Backend deployment (uses root fly.toml)"
echo ""
echo "🚀 Frontend app will be deployed as: ai-email-organizer-frontend"
echo "🔧 Backend app will be deployed as: ai-email-organizer"
