# X Enhancer - Complete Setup Guide

This guide will help you set up and run the X Enhancer MVP on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v6 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **npm** (v9 or higher) - Comes with Node.js
- **Git** - [Download](https://git-scm.com/)

### Optional but Recommended
- **Redis** (v7 or higher) - For caching - [Download](https://redis.io/download)
- **Docker & Docker Compose** - For containerized setup - [Download](https://www.docker.com/)

## Quick Start (5 Minutes)

### 1. Clone and Install

```bash
# Navigate to the project
cd x_enhancer

# Install root dependencies
npm install

# Install all workspace dependencies
npm install --workspaces
```

### 2. Configure Environment

```bash
# Copy example environment file
copy .env.example .env

# Edit .env file with your API keys
# At minimum, you need:
# - MongoDB connection string
# - JWT secrets (generate random strings)
# - OpenAI API key (for AI features)
```

### 3. Start MongoDB

**Option A - Local MongoDB:**
```bash
# Windows
mongod --dbpath C:\data\db

# macOS/Linux
mongod --dbpath /data/db
```

**Option B - Docker:**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Start the Application

```bash
# Start both backend and frontend
npm run dev
```

This will start:
- Backend API on http://localhost:5000
- Frontend app on http://localhost:3000

### 5. Build Chrome Extension

```bash
cd extension
npm install
npm run build
```

Then load the extension:
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/dist` folder

## Detailed Setup

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Start development server
npm run dev

# The API will be available at http://localhost:5000
# API Documentation: http://localhost:5000/api-docs
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# App will be available at http://localhost:3000
```

### Extension Setup

```bash
cd extension

# Install dependencies
npm install

# Build for production
npm run build

# Or watch for changes during development
npm run watch
```

## Getting API Keys

### 1. OpenAI API Key
1. Go to https://platform.openai.com/
2. Sign up/login
3. Navigate to API Keys section
4. Create new secret key
5. Add to `.env` as `OPENAI_API_KEY`

### 2. Twitter API Keys
1. Go to https://developer.twitter.com/
2. Create a developer account
3. Create a new app
4. Get your API keys and tokens
5. Add to `.env`:
   - `TWITTER_API_KEY`
   - `TWITTER_API_SECRET`
   - `TWITTER_BEARER_TOKEN`

### 3. Optional: Grok API
1. Visit https://x.ai/
2. Request API access
3. Add `GROK_API_KEY` to `.env`

## Docker Setup (Alternative)

If you prefer Docker:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

This will start:
- MongoDB on port 27017
- Redis on port 6379
- Backend on port 5000
- Frontend on port 3000

## Testing the Setup

### 1. Test Backend
```bash
# Health check
curl http://localhost:5000/health

# Should return: {"status":"success","message":"Server is healthy"}
```

### 2. Test Frontend
Open http://localhost:3000 in your browser. You should see the login page.

### 3. Create Test Account
1. Click "Sign up"
2. Fill in:
   - Name: Test User
   - Email: test@example.com
   - Password: testpassword123
3. Click "Create account"

## Common Issues & Solutions

### MongoDB Connection Error
**Error:** `MongoServerError: connect ECONNREFUSED`

**Solution:**
```bash
# Make sure MongoDB is running
# Windows: Start MongoDB service
# Mac: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

### Port Already in Use
**Error:** `Error: listen EADDRINUSE: address already in use :::5000`

**Solution:**
```bash
# Find and kill the process using the port
# Windows: netstat -ano | findstr :5000
# Mac/Linux: lsof -ti:5000 | xargs kill
```

### API Key Errors
**Error:** `OpenAI API key not configured`

**Solution:**
- Make sure you've added your API keys to the `.env` file
- Restart the backend server after adding keys
- Check that the `.env` file is in the root directory

### Extension Not Loading
**Solution:**
1. Rebuild the extension: `npm run build`
2. Reload the extension in Chrome
3. Check browser console for errors

## Development Workflow

### Making Changes

**Backend changes:**
- Edit files in `backend/src/`
- Server auto-restarts with nodemon

**Frontend changes:**
- Edit files in `frontend/src/`
- Browser auto-refreshes with Vite

**Extension changes:**
- Edit files in `extension/src/`
- Run `npm run build` or use `npm run watch`
- Reload extension in Chrome

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment instructions.

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | Yes |
| `PORT` | Backend server port | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret for JWT tokens | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `TWITTER_BEARER_TOKEN` | Twitter API bearer token | No |
| `REDIS_URL` | Redis connection string | No |
| `AWS_ACCESS_KEY_ID` | AWS credentials for S3 | No |

## Next Steps

After successful setup:

1. **Connect Twitter Account** - Link your Twitter account in Settings
2. **Generate Your First Tweet** - Use the AI Writer to create content
3. **Schedule Tweets** - Plan your content calendar
4. **View Analytics** - Track your performance
5. **Install Extension** - Get real-time insights on Twitter

## Support

For issues or questions:
- Check the [FAQ](./FAQ.md)
- Open an issue on GitHub
- Join our Discord community

## License

MIT License - See [LICENSE](./LICENSE) file for details
