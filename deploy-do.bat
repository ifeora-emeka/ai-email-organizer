@echo off

echo 🚀 Deploying AI Email Organizer Frontend to DigitalOcean...

where doctl >nul 2>nul
if errorlevel 1 (
    echo ❌ doctl CLI not found. Please install it first:
    echo    https://docs.digitalocean.com/reference/doctl/how-to/install/
    exit /b 1
)

if not exist .do\app.yaml (
    echo ❌ App configuration not found at .do\app.yaml
    exit /b 1
)

echo 📋 Validating app configuration...
doctl apps spec validate .do\app.yaml

if %errorlevel% equ 0 (
    echo ✅ Configuration is valid
    echo 🚀 Creating/updating app on DigitalOcean...
    
    doctl apps list --format ID,Spec.Name | findstr "ai-email-organizer-frontend" >nul
    if %errorlevel% equ 0 (
        echo 📝 Updating existing app...
        for /f "tokens=1" %%i in ('doctl apps list --format ID,Spec.Name --no-header ^| findstr "ai-email-organizer-frontend"') do (
            doctl apps update %%i --spec .do\app.yaml
        )
    ) else (
        echo 🆕 Creating new app...
        doctl apps create --spec .do\app.yaml
    )
) else (
    echo ❌ Configuration validation failed
    exit /b 1
)

echo ✅ Deployment initiated successfully!
echo 🔗 Check your app status at: https://cloud.digitalocean.com/apps
