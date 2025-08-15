# AI Email Organizer

A Next.js application with Express.js backend for AI-powered email organization.

## Getting Started

First, run the development server:

```bash
npm install
npm run dev:server
```

Open [http://localhost:8080](http://localhost:8080) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Production Build

```bash
npm run build
npm start
```

## Fly.io Deployment

### Prerequisites

1. Install Fly CLI: https://fly.io/docs/flyctl/install/
2. Install Docker: https://docs.docker.com/get-docker/
3. Sign up for Fly.io account: https://fly.io/docs/getting-started/

### Initial Setup

```bash
flyctl auth signup
flyctl auth login
```

### Deploy (Method 1 - Using Deploy Script)

```bash
# On Windows
deploy.bat

# On Linux/Mac
chmod +x deploy.sh
./deploy.sh
```

### Deploy (Method 2 - Manual)

If you encounter the flyctl launch bug, use this workaround:

```bash
# Build locally first
npm run build

# Create the app (only needed once)
fly apps create ai-email-organizer

# Deploy using local Docker build
fly deploy --local-only
```

### Environment Variables

Set production environment variables:

```bash
fly secrets set NODE_ENV=production
fly secrets set PORT=8080
```

### Monitoring

```bash
flyctl status
flyctl logs
flyctl ssh console
```

### Scaling

```bash
flyctl scale count 2
flyctl scale memory 512
```

## API Endpoints

- `GET /api/v1/health` - Health check with detailed information
- `GET /api/v1/ping` - Simple ping endpoint

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

Check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
