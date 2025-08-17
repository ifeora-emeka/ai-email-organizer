#!/bin/bash

set -e

echo "🚀 Preparing frontend deployment..."

cd "$(dirname "$0")"/../..

echo "📦 Copying project files..."
cp -r app ./deploy/frontend/
cp -r components ./deploy/frontend/
cp -r lib ./deploy/frontend/
cp -r context ./deploy/frontend/
cp -r public ./deploy/frontend/
cp -r types ./deploy/frontend/

cp package.json ./deploy/frontend/
cp package-lock.json ./deploy/frontend/ 2>/dev/null || echo "No package-lock.json found"
cp next.config.ts ./deploy/frontend/
cp tsconfig.json ./deploy/frontend/
cp tailwind.config.ts ./deploy/frontend/ 2>/dev/null || echo "No tailwind.config.ts found"
cp postcss.config.mjs ./deploy/frontend/
cp components.json ./deploy/frontend/
cp next-env.d.ts ./deploy/frontend/

echo "⚙️  Creating frontend-specific Next.js config..."
cat > ./deploy/frontend/next.config.ts << 'EOF'
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://ai-email-organizer.fly.dev/api/v1',
  },
}

export default nextConfig;
EOF

echo "📝 Creating frontend-specific package.json..."
node -e "
const pkg = require('./package.json');
const frontendPkg = {
  ...pkg,
  scripts: {
    'build': 'next build',
    'start': 'next start',
    'dev': 'next dev',
    'lint': 'next lint'
  }
};
require('fs').writeFileSync('./deploy/frontend/package.json', JSON.stringify(frontendPkg, null, 2));
"

echo "🌍 Setting up environment variables..."
cat > ./deploy/frontend/.env << 'EOF'
NODE_ENV=production
PORT=3000
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_API_URL=https://ai-email-organizer.fly.dev/api/v1
NEXTAUTH_URL=https://ai-email-organizer-frontend.fly.dev
EOF

echo "📋 Creating .dockerignore..."
cat > ./deploy/frontend/.dockerignore << 'EOF'
node_modules
.next
.git
.env.local
.env.development.local
.env.test.local
.env.production.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*
README.md
coverage
.nyc_output
tests
server
prisma
scripts
mock
doc
deploy
EOF

cd ./deploy/frontend

echo "✅ Frontend deployment prepared successfully!"
echo "🚀 To deploy, run: fly deploy"
