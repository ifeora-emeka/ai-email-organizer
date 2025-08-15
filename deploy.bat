@echo off
setlocal enabledelayedexpansion

echo 🚀 Starting deployment to Fly.io...

echo 📦 Building application locally...
call npm run build
if !errorlevel! neq 0 (
    echo ❌ Build failed!
    exit /b 1
)

echo 🐳 Building Docker image...
docker build -t ai-email-organizer .
if !errorlevel! neq 0 (
    echo ❌ Docker build failed!
    exit /b 1
)

echo 🎯 Deploying to Fly.io...
fly deploy --local-only
if !errorlevel! neq 0 (
    echo ❌ Deployment failed!
    exit /b 1
)

echo ✅ Deployment complete!
echo 🌐 Your app should be available at: https://ai-email-organizer.fly.dev

echo 📊 Checking app status...
fly status

echo 📝 Recent logs:
fly logs --limit 50

pause
