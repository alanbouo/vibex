# X Enhancer API Documentation

Base URL: `http://localhost:5000/api` (development)

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### Authentication

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

### AI Features

#### Generate Tweet
```http
POST /ai/generate-tweet
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "Share tips about productivity",
  "tone": "professional",
  "creativity": 0.7
}
```

#### Generate Variations
```http
POST /ai/generate-variations
Authorization: Bearer <token>
Content-Type: application/json

{
  "tweet": "Original tweet content",
  "count": 3,
  "tone": "casual"
}
```

#### Generate Thread
```http
POST /ai/generate-thread
Authorization: Bearer <token>
Content-Type: application/json

{
  "topic": "Benefits of remote work",
  "threadLength": 5,
  "tone": "friendly"
}
```

### Tweets

#### Create Draft Tweet
```http
POST /tweets
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "My tweet content",
  "type": "tweet",
  "aiGenerated": true
}
```

#### Get All Tweets
```http
GET /tweets?status=draft&limit=20&page=1
Authorization: Bearer <token>
```

#### Publish Tweet
```http
POST /tweets/:id/publish
Authorization: Bearer <token>
```

### Scheduler

#### Schedule Tweet
```http
POST /scheduler/schedule
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Scheduled tweet content",
  "scheduledFor": "2024-12-25T10:00:00Z"
}
```

#### Get Scheduled Tweets
```http
GET /scheduler/scheduled
Authorization: Bearer <token>
```

#### Get Optimal Posting Time
```http
GET /scheduler/optimal-time
Authorization: Bearer <token>
```

### Analytics

#### Get Analytics Summary
```http
GET /analytics/summary?period=daily&startDate=2024-01-01
Authorization: Bearer <token>
```

#### Sync Twitter Analytics
```http
POST /analytics/sync
Authorization: Bearer <token>
```

#### Get Growth Metrics
```http
GET /analytics/growth?days=30
Authorization: Bearer <token>
```

### Profile

#### Connect Twitter Account
```http
POST /profiles/connect-twitter
Authorization: Bearer <token>
Content-Type: application/json

{
  "accessToken": "twitter_access_token",
  "userId": "twitter_user_id",
  "username": "twitter_username"
}
```

#### Analyze External Profile
```http
POST /profiles/analyze
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "elonmusk"
}
```

## Response Format

### Success Response
```json
{
  "status": "success",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error description"
}
```

## Rate Limits

- **Free Tier**: 100 requests/hour
- **Pro Tier**: 1000 requests/hour
- **Advanced Tier**: Unlimited

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Webhooks

Coming soon...

## SDKs

JavaScript SDK coming soon...
