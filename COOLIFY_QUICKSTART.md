# Coolify Deployment Guide - Separate Frontend & Backend

Deploy Vibex to Coolify with separate frontend and backend services for better flexibility and independent scaling.

## Prerequisites

- Coolify instance running
- Git repository connected to Coolify
- Two subdomains configured (e.g., `vibex.yourdomain.com` and `api.vibex.yourdomain.com`)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Coolify Server                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │    Frontend     │    │           Backend               │ │
│  │  (Dockerfile)   │    │  (Dockerfile + MongoDB + Redis) │ │
│  │                 │    │                                 │ │
│  │  vibex.domain   │───▶│  api.vibex.domain               │ │
│  │     :80         │    │       :5000                     │ │
│  └─────────────────┘    └─────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Part 1: Deploy the Backend

The backend includes the API server, MongoDB, and Redis.

### Step 1.1: Create Backend Project

1. Login to Coolify Dashboard
2. Click **"+ Add"** → **"Project"**
3. Name it: `vibex-backend`

### Step 1.2: Add MongoDB Service

1. Inside `vibex-backend` project, click **"+ Add"** → **"Resource"**
2. Select **"Database"** → **"MongoDB"**
3. Configure:
   - **Name:** `mongodb`
   - **Version:** `7.0`
   - **Root Username:** `admin`
   - **Root Password:** Generate a secure password (save it!)
   - **Initial Database:** `vibex`
4. Click **"Start"**

### Step 1.3: Add Redis Service

1. Click **"+ Add"** → **"Resource"**
2. Select **"Database"** → **"Redis"**
3. Configure:
   - **Name:** `redis`
   - **Version:** `7-alpine`
4. Click **"Start"**

### Step 1.4: Deploy Backend API

1. Click **"+ Add"** → **"Resource"**
2. Select **"Application"** → **"Dockerfile"**
3. Connect your Git repository
4. Configure:
   - **Name:** `backend`
   - **Branch:** `main`
   - **Base Directory:** `/backend`
   - **Dockerfile Location:** `/backend/Dockerfile`
   - **Port:** `5000`

### Step 1.5: Configure Backend Environment Variables

Go to **Environment Variables** and add:

```env
# === APPLICATION ===
NODE_ENV=production
PORT=5000

# === DATABASE (use internal Coolify URLs) ===
MONGODB_URI=mongodb://admin:YOUR_MONGO_PASSWORD@mongodb:27017/vibex?authSource=admin
REDIS_URL=redis://redis:6379

# === AUTHENTICATION (generate with: openssl rand -base64 32) ===
JWT_SECRET=YOUR_GENERATED_JWT_SECRET
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=YOUR_GENERATED_REFRESH_SECRET
REFRESH_TOKEN_EXPIRES_IN=30d

# === URLS ===
FRONTEND_URL=https://vibex.yourdomain.com

# === AI SERVICES ===
OPENAI_API_KEY=sk-your-openai-key
GROK_API_KEY=your-grok-key
ANTHROPIC_API_KEY=your-anthropic-key

# === AWS S3 (optional, for media storage) ===
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=vibex-media

# === SMTP (optional, for emails) ===
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# === FEATURE FLAGS ===
ENABLE_AI_WRITER=true
ENABLE_SCHEDULER=true
ENABLE_ANALYTICS=true
ENABLE_CHROME_EXTENSION=true
```

### Step 1.6: Configure Backend Domain

1. Go to **Domains** tab
2. Add domain: `api.vibex.yourdomain.com`
3. Port: `5000`
4. Enable **"Generate SSL Certificate"**

### Step 1.7: Configure Network

Ensure MongoDB, Redis, and Backend are on the same network:

1. Go to each service → **Settings** → **Network**
2. Create or select a shared network (e.g., `vibex-network`)
3. Add all three services to this network

### Step 1.8: Deploy Backend

1. Click **"Deploy"** on the backend service
2. Wait for build to complete
3. Verify: `curl https://api.vibex.yourdomain.com/health`

Expected response:
```json
{"status":"ok"}
```

---

## Part 2: Deploy the Frontend

The frontend is a static Nginx container serving the React app.

### Step 2.1: Create Frontend Project

1. Click **"+ Add"** → **"Project"**
2. Name it: `vibex-frontend`

### Step 2.2: Deploy Frontend Application

1. Click **"+ Add"** → **"Resource"**
2. Select **"Application"** → **"Dockerfile"**
3. Connect your Git repository
4. Configure:
   - **Name:** `frontend`
   - **Branch:** `main`
   - **Base Directory:** `/frontend`
   - **Dockerfile Location:** `/frontend/Dockerfile.coolify`
   - **Port:** `80`

> **Important:** Use `Dockerfile.coolify` (not `Dockerfile`) for Coolify deployments. The regular Dockerfile includes an nginx proxy to `backend:5000` which only works with docker-compose.

### Step 2.3: Configure Frontend Build Arguments

Go to **Environment Variables** → **Build Variables** and add:

```env
VITE_API_URL=https://api.vibex.yourdomain.com
```

> **Important:** This is a **build-time** variable. The frontend bakes the API URL into the static files during build.

### Step 2.4: Configure Frontend Domain

1. Go to **Domains** tab
2. Add domain: `vibex.yourdomain.com`
3. Port: `80`
4. Enable **"Generate SSL Certificate"**

### Step 2.5: Deploy Frontend

1. Click **"Deploy"**
2. Wait for build to complete
3. Visit `https://vibex.yourdomain.com`

---

## Part 3: DNS Configuration

Add these A records to your DNS provider:

| Type | Name | Value |
|------|------|-------|
| A | `vibex.yourdomain.com` | `YOUR_COOLIFY_SERVER_IP` |
| A | `api.vibex.yourdomain.com` | `YOUR_COOLIFY_SERVER_IP` |

Wait 1-5 minutes for DNS propagation.

---

## Generate Secrets

Run these commands locally to generate secure secrets:

```bash
# JWT Secret
openssl rand -base64 32

# Refresh Token Secret
openssl rand -base64 32

# MongoDB Password
openssl rand -base64 24
```

---

## Verification Checklist

After deployment, verify everything works:

```bash
# 1. Test backend health
curl https://api.vibex.yourdomain.com/health
# Expected: {"status":"ok"}

# 2. Test frontend
curl -I https://vibex.yourdomain.com
# Expected: HTTP/2 200

# 3. Test API from browser console (on frontend)
fetch('https://api.vibex.yourdomain.com/health').then(r => r.json()).then(console.log)
```

---

## Common Issues & Fixes

### Backend can't connect to MongoDB

**Cause:** Services not on the same network or wrong connection string.

**Fix:**
1. Verify all services are on the same Coolify network
2. Check `MONGODB_URI` uses the correct internal hostname (`mongodb`, not `localhost`)
3. Verify MongoDB password matches

### Frontend shows "Cannot connect to server"

**Cause:** `VITE_API_URL` not set correctly during build.

**Fix:**
1. Go to Frontend → Environment Variables → Build Variables
2. Set `VITE_API_URL=https://api.vibex.yourdomain.com`
3. **Redeploy** the frontend (build variables require rebuild)

### CORS errors in browser

**Cause:** Backend `FRONTEND_URL` doesn't match actual frontend domain.

**Fix:**
1. Go to Backend → Environment Variables
2. Set `FRONTEND_URL=https://vibex.yourdomain.com` (exact match, no trailing slash)
3. Redeploy backend

### SSL Certificate Error

**Cause:** DNS not propagated yet.

**Fix:**
1. Verify DNS A records point to Coolify server IP
2. Wait 5-10 minutes
3. Click "Generate Certificate" again in Coolify

---

## Updating Services

### Update Backend Only
1. Push changes to `backend/` folder
2. Go to Coolify → `vibex-backend` → `backend`
3. Click **"Deploy"**

### Update Frontend Only
1. Push changes to `frontend/` folder
2. Go to Coolify → `vibex-frontend` → `frontend`
3. Click **"Deploy"**

### Enable Auto-Deploy

For each service:
1. Go to **Settings** → **General**
2. Enable **"Deploy on Push"**
3. Copy the webhook URL
4. Add webhook to your GitHub/GitLab repository

---

## Monitoring & Logs

### View Logs
```
Coolify → Project → Service → Logs
```

### Monitor Resources
```
Coolify → Project → Service → Metrics
```

---

## Backups

### MongoDB Backups
1. Go to `vibex-backend` → `mongodb` → **Backups**
2. Configure:
   - **Method:** S3 or Local
   - **Schedule:** Daily at 2 AM
3. Save

---

## Estimated Costs

| Provider | Server Type | Monthly Cost |
|----------|-------------|--------------|
| Hetzner | CPX31 (4 vCPU, 8GB RAM) | €10-15 |
| DigitalOcean | Droplet (4GB RAM) | $24 |
| Vultr | High Frequency (4GB) | $24 |

**Plus domain:** ~$10-15/year

**Total:** €10-30/month

---

## Quick Reference

| Service | URL | Port |
|---------|-----|------|
| Frontend | `https://vibex.yourdomain.com` | 80 |
| Backend API | `https://api.vibex.yourdomain.com` | 5000 |
| MongoDB | Internal: `mongodb:27017` | 27017 |
| Redis | Internal: `redis:6379` | 6379 |

---

## Need Help?

- [Full Deployment Guide](./DEPLOYMENT.md)
- [Coolify Documentation](https://coolify.io/docs)
- [Coolify Discord](https://discord.gg/coolify)
