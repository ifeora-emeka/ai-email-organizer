@echo off
setlocal enabledelayedexpansion

echo 🚀 Preparing frontend deployment...

cd /d "%~dp0"..\..\

echo 📦 Copying project files...
xcopy /E /I /Y app deploy\frontend\app
xcopy /E /I /Y components deploy\frontend\components
xcopy /E /I /Y lib deploy\frontend\lib
xcopy /E /I /Y context deploy\frontend\context
xcopy /E /I /Y public deploy\frontend\public
xcopy /E /I /Y types deploy\frontend\types

copy /Y package.json deploy\frontend\
if exist package-lock.json copy /Y package-lock.json deploy\frontend\
copy /Y next.config.ts deploy\frontend\
copy /Y tsconfig.json deploy\frontend\
if exist tailwind.config.ts copy /Y tailwind.config.ts deploy\frontend\
copy /Y postcss.config.mjs deploy\frontend\
copy /Y components.json deploy\frontend\
copy /Y next-env.d.ts deploy\frontend\

echo ⚙️  Creating frontend-specific Next.js config...
(
echo import type { NextConfig } from "next";
echo.
echo const nextConfig: NextConfig = {
echo   serverExternalPackages: ['@prisma/client'],
echo   eslint: {
echo     ignoreDuringBuilds: true,
echo   },
echo   typescript: {
echo     ignoreBuildErrors: true,
echo   },
echo   output: 'standalone',
echo   env: {
echo     NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ^|^| 'https://ai-email-organizer.fly.dev/api/v1',
echo   },
echo }
echo.
echo export default nextConfig;
) > deploy\frontend\next.config.ts

echo 📝 Creating frontend-specific package.json...
node -e "const pkg = require('./package.json'); const frontendPkg = { ...pkg, scripts: { 'build': 'next build', 'start': 'next start', 'dev': 'next dev', 'lint': 'next lint' } }; require('fs').writeFileSync('./deploy/frontend/package.json', JSON.stringify(frontendPkg, null, 2));"

echo 🌍 Setting up environment variables...
(
echo NODE_ENV=production
echo PORT=3000
echo NEXT_TELEMETRY_DISABLED=1
echo NEXT_PUBLIC_API_URL=https://ai-email-organizer.fly.dev/api/v1
echo NEXTAUTH_URL=https://ai-email-organizer-frontend.fly.dev
) > deploy\frontend\.env

echo 📋 Creating .dockerignore...
(
echo node_modules
echo .next
echo .git
echo .env.local
echo .env.development.local
echo .env.test.local
echo .env.production.local
echo npm-debug.log*
echo yarn-debug.log*
echo yarn-error.log*
echo README.md
echo coverage
echo .nyc_output
echo tests
echo server
echo prisma
echo scripts
echo mock
echo doc
echo deploy
) > deploy\frontend\.dockerignore

cd deploy\frontend

echo ✅ Frontend deployment prepared successfully!
echo 🚀 To deploy, run: fly deploy
