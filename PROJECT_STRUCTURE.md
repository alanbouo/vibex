# X Enhancer - Project Structure

```
x_enhancer/
├── backend/                      # Node.js/Express API Server
│   ├── src/
│   │   ├── config/              # Configuration files
│   │   │   └── database.js      # MongoDB connection
│   │   ├── controllers/         # Route controllers
│   │   │   ├── auth.controller.js
│   │   │   ├── user.controller.js
│   │   │   ├── tweet.controller.js
│   │   │   ├── ai.controller.js
│   │   │   ├── scheduler.controller.js
│   │   │   ├── analytics.controller.js
│   │   │   └── profile.controller.js
│   │   ├── models/             # MongoDB schemas
│   │   │   ├── User.model.js
│   │   │   ├── Tweet.model.js
│   │   │   └── Analytics.model.js
│   │   ├── routes/             # API routes
│   │   │   ├── auth.routes.js
│   │   │   ├── user.routes.js
│   │   │   ├── tweet.routes.js
│   │   │   ├── ai.routes.js
│   │   │   ├── scheduler.routes.js
│   │   │   ├── analytics.routes.js
│   │   │   └── profile.routes.js
│   │   ├── middleware/         # Express middleware
│   │   │   ├── auth.middleware.js
│   │   │   ├── errorHandler.js
│   │   │   ├── notFound.js
│   │   │   └── rateLimiter.js
│   │   ├── services/           # Business logic
│   │   │   ├── ai.service.js
│   │   │   ├── twitter.service.js
│   │   │   └── scheduler.service.js
│   │   ├── utils/              # Utility functions
│   │   │   ├── logger.js
│   │   │   ├── AppError.js
│   │   │   ├── asyncHandler.js
│   │   │   └── jwt.js
│   │   └── server.js           # Entry point
│   ├── tests/                  # Test files
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                    # React.js Web Application
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   │   ├── Layout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Button.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/              # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── AIWriter.jsx
│   │   │   ├── Scheduler.jsx
│   │   │   ├── Analytics.jsx
│   │   │   └── Settings.jsx
│   │   ├── services/           # API service layer
│   │   │   └── api.js
│   │   ├── store/              # State management
│   │   │   └── authStore.js
│   │   ├── lib/                # Utilities
│   │   │   └── utils.js
│   │   ├── App.jsx             # Root component
│   │   ├── main.jsx            # Entry point
│   │   └── index.css           # Global styles
│   ├── public/                 # Static assets
│   ├── Dockerfile
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── extension/                   # Chrome Extension
│   ├── src/
│   │   ├── background.js       # Background service worker
│   │   ├── content.js          # Content script
│   │   ├── content.css         # Content styles
│   │   └── popup.js            # Popup script
│   ├── manifest.json           # Extension manifest
│   ├── popup.html              # Popup UI
│   ├── webpack.config.js
│   └── package.json
│
├── .env.example                # Environment variables template
├── .env.development            # Development environment
├── .gitignore                  # Git ignore rules
├── docker-compose.yml          # Docker compose config
├── package.json                # Root package.json
├── README.md                   # Main documentation
├── SETUP_GUIDE.md             # Setup instructions
├── DEPLOYMENT.md              # Deployment guide
├── API_DOCUMENTATION.md       # API reference
├── PROJECT_STRUCTURE.md       # This file
└── LICENSE                    # MIT License
```

## Key Components

### Backend Architecture
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **OpenAI API** - AI features
- **Twitter API** - Social integration

### Frontend Architecture
- **React 18** - UI library
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Router** - Navigation
- **Zustand** - State management
- **TanStack Query** - Data fetching
- **Axios** - HTTP client

### Extension Architecture
- **Manifest V3** - Extension format
- **Content Scripts** - Page injection
- **Background Worker** - API communication
- **Popup UI** - Extension interface

## Data Flow

1. **User Authentication**
   - User logs in → JWT token generated
   - Token stored in localStorage
   - Token sent with all API requests

2. **AI Tweet Generation**
   - User enters prompt → Frontend
   - API call to `/ai/generate-tweet` → Backend
   - OpenAI API called → AI Service
   - Generated tweet returned → Frontend
   - User can save as draft

3. **Tweet Scheduling**
   - User creates scheduled tweet → Frontend
   - API call to `/scheduler/schedule` → Backend
   - Saved to MongoDB with scheduled time
   - Cron job checks every minute → Scheduler Service
   - Publishes to Twitter via API

4. **Chrome Extension**
   - User visits Twitter profile
   - Content script detects profile
   - Sends username to background worker
   - API call to analyze profile
   - Insights displayed on page

## Security Layers

1. **Authentication** - JWT tokens
2. **Authorization** - Role-based access
3. **Input Validation** - Express Validator
4. **Rate Limiting** - Per-tier limits
5. **CORS** - Restricted origins
6. **Helmet** - Security headers
7. **MongoDB Sanitization** - NoSQL injection prevention

## Scalability Considerations

- **Horizontal Scaling** - Multiple backend instances
- **Caching** - Redis for frequently accessed data
- **Database Indexing** - Optimized queries
- **CDN** - Static asset delivery
- **Queue System** - Bull for job processing
- **Load Balancing** - Nginx or AWS ALB

## Feature Roadmap

### Phase 1 (MVP) ✅
- User authentication
- AI tweet generation
- Tweet scheduler
- Basic analytics
- Chrome extension

### Phase 2 (Next)
- Multi-platform posting (LinkedIn, Bluesky)
- Advanced analytics dashboard
- Content library
- Team collaboration
- Video content repurposing

### Phase 3 (Future)
- Mobile app
- API marketplace
- White-label solution
- Advanced automation
- ML-powered predictions
