#!/bin/bash

echo "🚀 Deploying AI Email Organizer Frontend to DigitalOcean..."

if ! command -v doctl &> /dev/null; then
    echo "❌ doctl CLI not found. Please install it first:"
    echo "   https://docs.digitalocean.com/reference/doctl/how-to/install/"
    exit 1
fi

if [ ! -f .do/app.yaml ]; then
    echo "❌ App configuration not found at .do/app.yaml"
    exit 1
fi

echo "📋 Validating app configuration..."
doctl apps spec validate .do/app.yaml

if [ $? -eq 0 ]; then
    echo "✅ Configuration is valid"
    echo "🚀 Creating/updating app on DigitalOcean..."
    
    if doctl apps list --format ID,Spec.Name | grep -q "ai-email-organizer-frontend"; then
        echo "📝 Updating existing app..."
        APP_ID=$(doctl apps list --format ID,Spec.Name --no-header | grep "ai-email-organizer-frontend" | awk '{print $1}')
        doctl apps update $APP_ID --spec .do/app.yaml
    else
        echo "🆕 Creating new app..."
        doctl apps create --spec .do/app.yaml
    fi
else
    echo "❌ Configuration validation failed"
    exit 1
fi

echo "✅ Deployment initiated successfully!"
echo "🔗 Check your app status at: https://cloud.digitalocean.com/apps"
