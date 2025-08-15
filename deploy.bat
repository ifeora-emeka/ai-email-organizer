@echo off
s@echo off
setlocal enabledelayedexpansion

echo 🚀 Starting deployment to Fly.io...

echo 📦 Building application locally...
call npm run build
if !errorlevel! neq 0 (
    echo ❌ Build failed!
    exit /b 1
)

echo 🔍 Checking if Fly.io app exists...
fly status >nul 2>&1
if !errorlevel! neq 0 (
    echo 🆕 Creating new Fly.io app...
    fly apps create ai-email-organizer
)

echo 🐳 Deploying with Docker...
fly deploy
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

pausetlocal enabledelayedexpansion

echo 🚀 Starting deployment to Fly.io...

echo 📦 Building application locally...
call npm run build
if !errorlevel! neq 0 (
    echo ❌ Build failed!
    exit /b 1
)

echo � Checking if Fly.io app exists...
fly status >nul 2>&1
if !errorlevel! neq 0 (
    echo 🆕 Creating new Fly.io app...
    fly apps create ai-email-organizer --org personal
)

echo 🐳 Building and deploying with Docker...
fly deploy --local-only --dockerfile Dockerfile
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
