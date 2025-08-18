# AI Email Organizer

![AI Email Organizer](./doc/image.png)

## Overview

An intelligent email management application that automatically categorizes and summarizes your emails using AI. Built as part of a 72-hour coding challenge, this app demonstrates the power of AI-driven email organization with automated unsubscribe functionality.

## 🚀 Live Demo

**Deployed Application**: [Coming Soon - Deployment in Progress]

## 📋 Challenge Requirements

This project was built as a response to a paid coding challenge with the following specifications:

### Core Features Implemented ✅

- **Google OAuth Authentication**: Sign in with Google to access your Gmail
- **Multi-Account Support**: Connect and manage multiple Gmail accounts
- **AI-Powered Categorization**: Automatically sort emails into custom categories using OpenAI
- **Smart Summarization**: AI-generated summaries for each email
- **Automatic Gmail Archiving**: Processed emails are archived in Gmail
- **Custom Categories**: Create categories with names and descriptions for AI guidance
- **Bulk Actions**: Select multiple emails for batch operations
- **Intelligent Unsubscribe**: AI agent automatically finds and processes unsubscribe links
- **Email Reading**: View full email content when needed
- **Comprehensive Testing**: Both frontend and backend test suites

### Technical Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Express.js, Node.js, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **AI Integration**: OpenAI GPT-4 for email categorization and summarization
- **Authentication**: NextAuth.js with Google OAuth
- **Email Processing**: Gmail API integration
- **Web Scraping**: Puppeteer for unsubscribe automation
- **Testing**: Jest with comprehensive test coverage
- **Deployment**: Fly.io ready configuration

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js UI    │    │  Express API    │    │   PostgreSQL    │
│                 │◄──►│                 │◄──►│                 │
│ - Authentication│    │ - Gmail API     │    │ - User Data     │
│ - Category Mgmt │    │ - AI Processing │    │ - Categories    │
│ - Email Display │    │ - Unsubscribe   │    │ - Emails        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────►│   OpenAI API    │◄─────────────┘
                        │                 │
                        │ - Categorization│
                        │ - Summarization │
                        └─────────────────┘
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Google Cloud Console project with Gmail API enabled
- OpenAI API key

### Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ai_email_organizer"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Google OAuth (Gmail API)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:8080/api/v1/gmail-accounts/callback"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# API Configuration
NEXT_PUBLIC_API_URL="http://localhost:8080/api/v1"
CORS_ORIGIN="http://localhost:3000"
PORT=8080
NODE_ENV=development
```

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-email-organizer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

4. **Start development servers**
   ```bash
   # Terminal 1: Backend API
   npm run server:dev
   
   # Terminal 2: Frontend
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:8080
   - Health Check: http://localhost:8080/api/v1/health

## 🧪 Testing

The application includes comprehensive test coverage for both frontend and backend:

```bash
# Run all tests
npm run test:all

# Frontend tests only
npm run test:frontend

# Backend tests only
npm run test:backend

# Test coverage
npm run test:coverage
```

### Test Coverage

- **Backend Tests**: Controllers, services, middleware, and API endpoints
- **Frontend Tests**: Components, hooks, and user interactions
- **Integration Tests**: End-to-end workflow testing

## 🚀 Deployment

### Fly.io Deployment

The application is configured for deployment on Fly.io:

```bash
# Deploy to Fly.io
npm run deploy

# Or manually
fly deploy
```

### Environment Setup for Production

Ensure all environment variables are properly configured in your deployment platform:

- Database connection string
- Google OAuth credentials (with production callback URLs)
- OpenAI API key
- NextAuth secret and URL

## 📁 Project Structure

```
ai-email-organizer/
├── app/                    # Next.js app router
│   ├── (home)/            # Home page
│   ├── api/               # API routes
│   └── auth/              # Authentication pages
├── components/            # React components
│   ├── pages/             # Page-specific components
│   ├── ui/                # Reusable UI components
│   └── layout/            # Layout components
├── lib/                   # Utilities and services
│   ├── services/          # Business logic services
│   └── hooks/             # Custom React hooks
├── server/                # Express.js backend
│   ├── modules/           # API modules
│   └── middleware/        # Express middleware
├── tests/                 # Test suites
│   ├── frontend/          # React component tests
│   └── backend/           # API and service tests
├── prisma/                # Database schema and migrations
└── doc/                   # Documentation and assets
```

## 🔐 Security Considerations

- **OAuth Security**: Secure Google OAuth implementation with proper scopes
- **API Authentication**: JWT-based authentication for API endpoints
- **Data Protection**: Encrypted database connections and secure token storage
- **CORS Configuration**: Properly configured cross-origin resource sharing
- **Environment Variables**: Sensitive data stored in environment variables

## 🤖 AI Features

### Email Categorization
- Uses OpenAI GPT-4 to analyze email content
- Matches emails to user-defined categories based on descriptions
- Provides confidence scores for categorization accuracy

### Email Summarization
- Generates concise summaries of email content
- Extracts key information and action items
- Maintains context and important details

### Intelligent Unsubscribe
- AI agent automatically locates unsubscribe links
- Navigates unsubscribe pages and fills out forms
- Handles various unsubscribe UI patterns automatically

## 🔧 API Endpoints

### Authentication
- `POST /api/v1/auth/google-signin` - Google OAuth sign-in
- `GET /api/v1/auth/session` - Get current user session

### Gmail Accounts
- `GET /api/v1/gmail-accounts` - List connected Gmail accounts
- `POST /api/v1/gmail-accounts` - Connect new Gmail account
- `POST /api/v1/gmail-accounts/:id/polling/start` - Start email polling

### Categories
- `GET /api/v1/categories` - List user categories
- `POST /api/v1/categories` - Create new category
- `PUT /api/v1/categories/:id` - Update category
- `DELETE /api/v1/categories/:id` - Delete category

### Emails
- `GET /api/v1/emails` - List emails with filters
- `POST /api/v1/emails/bulk-unsubscribe` - Bulk unsubscribe from emails
- `PUT /api/v1/emails/:id` - Update email status

## 📊 Performance Considerations

- **Email Processing**: Asynchronous processing with queue management
- **Database Optimization**: Indexed queries and connection pooling
- **API Rate Limiting**: Implemented to prevent abuse
- **Caching**: Strategic caching for frequently accessed data
- **Pagination**: Efficient pagination for large email lists

## 🐛 Known Issues & Limitations

- **Google OAuth Review**: App requires Google's security review for production use with external users
- **Email Volume**: Performance testing needed for high-volume email processing
- **Unsubscribe Success Rate**: Varies depending on website implementation
- **Rate Limits**: Gmail API and OpenAI API rate limits may affect processing speed

## 🤝 Contributing

This project was built as part of a coding challenge, but contributions for improvements are welcome:

1. Fork the repository
2. Create a feature branch
3. Make your changes with appropriate tests
4. Submit a pull request

## 📄 License

This project is private and was created for a specific coding challenge.

## 🎯 Challenge Completion

**Status**: ✅ Complete
**Timeline**: 72 hours (August 15-18, 2025)
**Requirements Met**: All core features implemented and tested
**Deployment**: Ready for production deployment

---

Built with ❤️ using AI assistance and modern web technologies.
