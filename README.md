# X Enhancer - AI-Powered X (Twitter) Growth Platform

An MVP SaaS platform designed to help creators, influencers, and founders accelerate their growth on X (Twitter) through AI-driven content creation, automation, and analytics.

## 🚀 Features

### MVP Features
- **Chrome Extension**: Real-time insights on profiles and posts
- **AI Content Writer**: Generate and rewrite tweets with tone matching
- **Smart Scheduler**: Auto-optimal posting times with calendar view
- **Analytics Dashboard**: Performance tracking and growth metrics

### Planned Features
- Multi-platform cross-posting (LinkedIn, Bluesky)
- Content library with viral post search
- Team collaboration tools
- Predictive algorithm simulator
- Auto-DM and CTA automation

## 🏗️ Architecture

```
x-enhancer/
├── frontend/          # React.js web application
├── backend/           # Node.js/Express API server
├── extension/         # Chrome extension
└── ai-service/        # Python AI microservice (optional)
```

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, TailwindCSS, Shadcn/UI
- **Backend**: Node.js, Express, MongoDB, Redis
- **AI**: OpenAI API, Grok API, or Llama models
- **Extension**: Chrome Extension Manifest V3
- **Deployment**: AWS, Vercel, Docker

## 📦 Installation

### Prerequisites
- Node.js >= 18.0.0
- MongoDB >= 6.0
- Redis >= 7.0 (optional, for caching)
- npm >= 9.0.0

### Quick Start

1. **Clone the repository**
```bash
git clone <repository-url>
cd x-enhancer
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start MongoDB**
```bash
# macOS/Linux
mongod --dbpath ./data/db

# Windows
mongod --dbpath C:\data\db

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

5. **Run the development servers**
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:backend
npm run dev:frontend
```

6. **Build the Chrome extension**
```bash
npm run build:extension
```

Then load the extension from `extension/dist` in Chrome's extension manager.

## 🔧 Development

### Backend API Server
```bash
cd backend
npm install
npm run dev
```
API runs on http://localhost:5000

### Frontend Application
```bash
cd frontend
npm install
npm run dev
```
Web app runs on http://localhost:3000

### Chrome Extension
```bash
cd extension
npm install
npm run build
npm run watch  # For development with auto-rebuild
```

## 🔑 API Keys Setup

You'll need to obtain API keys for:

1. **X (Twitter) API** - https://developer.twitter.com
   - API Key & Secret
   - Bearer Token
   - OAuth 2.0 credentials

2. **OpenAI API** (for AI features) - https://platform.openai.com
   - Or Grok API from xAI
   - Or use open-source models (Llama, Mistral)

3. **AWS S3** (for media storage) - https://aws.amazon.com
   - Access Key ID
   - Secret Access Key

## 🏛️ Project Structure

### Backend
```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── middleware/      # Express middleware
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── server.js        # Entry point
├── tests/               # Test files
└── package.json
```

### Frontend
```
frontend/
├── src/
│   ├── components/      # React components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API service layer
│   ├── store/           # State management
│   ├── utils/           # Utilities
│   └── App.jsx          # Root component
├── public/              # Static assets
└── package.json
```

### Extension
```
extension/
├── src/
│   ├── background/      # Background scripts
│   ├── content/         # Content scripts
│   ├── popup/           # Extension popup
│   └── utils/           # Shared utilities
├── manifest.json        # Extension manifest
└── package.json
```

## 🚀 Deployment

### Backend (AWS/Railway/Render)
```bash
cd backend
npm run build
npm start
```

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy the 'dist' folder
```

### Extension (Chrome Web Store)
1. Build the extension: `npm run build:extension`
2. Zip the `extension/dist` folder
3. Upload to Chrome Web Store Developer Dashboard

## 🔒 Security

- JWT-based authentication
- Rate limiting on all endpoints
- Input validation and sanitization
- CORS configuration
- Environment variable protection
- No scraping without user consent

## 💰 Monetization

- **Free Tier**: Basic analytics and ideas
- **Pro ($19/mo)**: AI writing, scheduling, analytics
- **Advanced ($39/mo)**: Full automation, simulator, team features

## 📊 API Documentation

Once running, visit:
- Swagger UI: http://localhost:5000/api-docs
- API Health: http://localhost:5000/health

## 🧪 Testing

```bash
# Run all tests
npm test

# Backend tests
npm test --workspace=backend

# Frontend tests
npm test --workspace=frontend
```

## 🤝 Contributing

This is an MVP project. Contributions are welcome!

## 📝 License

MIT License - See LICENSE file for details

## 🛟 Support

For issues and questions, please open a GitHub issue.

## 🗺️ Roadmap

- [ ] Multi-platform posting (LinkedIn, Bluesky)
- [ ] Advanced analytics with predictions
- [ ] Team collaboration features
- [ ] Mobile app (React Native)
- [ ] Video content repurposing
- [ ] On-device AI option for privacy
- [ ] API marketplace for integrations

---

Built with ❤️ for X creators
