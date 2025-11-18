# Coolify Quick Start Guide

Deploy Vibex to Coolify in under 10 minutes!

## Prerequisites
✅ Coolify instance running  
✅ Git repository connected  
✅ Domain name (optional but recommended)  

## Quick Deployment Steps

### 1. Add Project to Coolify

```bash
1. Login to Coolify Dashboard
2. Click "+ New" → "Resource"
3. Select "Docker Compose"
4. Choose "Public Repository" or connect your Git
5. Repository URL: https://github.com/yourusername/vibex
6. Branch: main
```

### 2. Configure Project

```yaml
Build Pack: Docker Compose
Docker Compose File: /docker-compose.prod.yml
Base Directory: /
```

### 3. Generate Secrets

Run these commands locally to generate secure secrets:

```bash
# Generate JWT secrets
openssl rand -base64 32  # Use for JWT_SECRET
openssl rand -base64 32  # Use for REFRESH_TOKEN_SECRET

# Generate MongoDB password
openssl rand -base64 24  # Use for MONGO_PASSWORD
```

### 4. Add Environment Variables

In Coolify → Your Project → Environment, add these **required** variables:

```env
# === CRITICAL - UPDATE THESE ===
MONGO_PASSWORD=<paste-generated-password>
JWT_SECRET=<paste-generated-secret>
REFRESH_TOKEN_SECRET=<paste-generated-secret>
OPENAI_API_KEY=sk-your-actual-key

# === UPDATE WITH YOUR DOMAINS ===
BACKEND_URL=https://api.vibex.yourdomain.com
FRONTEND_URL=https://vibex.yourdomain.com
TWITTER_CALLBACK_URL=https://api.vibex.yourdomain.com/api/auth/twitter/callback

# === OPTIONAL BUT RECOMMENDED ===
TWITTER_BEARER_TOKEN=your-twitter-token
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=vibex-media

# === DEFAULT VALUES (can customize) ===
MONGO_USERNAME=admin
NODE_ENV=production
BACKEND_PORT=5000
FRONTEND_PORT=80
```

> 💡 **Tip:** Copy all variables from `.env.coolify` file and customize them

### 5. Configure Domains

#### Backend Service (API)
1. Go to your project → `backend` service
2. Add domain: `api.vibex.yourdomain.com`
3. Port: `5000`
4. Enable "Generate Let's Encrypt Certificate"

#### Frontend Service
1. Go to your project → `frontend` service  
2. Add domain: `vibex.yourdomain.com`
3. Port: `80`
4. Enable "Generate Let's Encrypt Certificate"

### 6. Configure DNS

Add these A records to your DNS provider:

```
Type    Name                          Value
----    ----                          -----
A       vibex.yourdomain.com          YOUR_COOLIFY_SERVER_IP
A       api.vibex.yourdomain.com      YOUR_COOLIFY_SERVER_IP
```

Wait 1-5 minutes for DNS propagation.

### 7. Deploy! 🚀

```bash
1. Click "Deploy" button
2. Watch the build logs
3. Wait for all services to start (green indicators)
   - MongoDB ✅
   - Redis ✅  
   - Backend ✅
   - Frontend ✅
```

### 8. Verify Deployment

Test your deployment:

```bash
# Test backend
curl https://api.vibex.yourdomain.com/health
# Expected: {"status":"ok"}

# Test frontend
curl -I https://vibex.yourdomain.com
# Expected: HTTP/2 200
```

Visit `https://vibex.yourdomain.com` in your browser! 🎉

## Common Issues & Fixes

### ❌ Build Failed
```bash
Cause: Missing environment variables
Fix: Check all required variables are set in Environment section
```

### ❌ Backend Can't Connect to Database
```bash
Cause: MongoDB not ready or wrong credentials
Fix: 
1. Check MongoDB logs in Coolify
2. Verify MONGO_PASSWORD matches in all places
3. Wait 30s for MongoDB to fully start
```

### ❌ Frontend Shows "Cannot connect to server"
```bash
Cause: BACKEND_URL not set correctly
Fix: Update BACKEND_URL to your actual API domain
Environment → BACKEND_URL=https://api.vibex.yourdomain.com
Redeploy frontend
```

### ❌ SSL Certificate Error
```bash
Cause: DNS not propagated or Let's Encrypt rate limit
Fix:
1. Verify DNS points to correct IP
2. Wait 5-10 minutes for DNS propagation
3. Try "Generate Certificate" again
```

## Post-Deployment Checklist

- [ ] Both domains accessible via HTTPS
- [ ] Backend health endpoint returns OK
- [ ] Can login/register users
- [ ] AI features working (requires OPENAI_API_KEY)
- [ ] Twitter integration working (requires Twitter API keys)
- [ ] Database persisting data (test by restarting containers)

## Optional: Enable Auto-Deploy

Automatically deploy when you push to Git:

```bash
1. Go to Project → Settings → General
2. Enable "Deploy on Push"
3. Add webhook to your Git repository
4. Copy webhook URL from Coolify
5. Add to GitHub/GitLab webhooks
```

## Monitoring

View logs and metrics:

```bash
# In Coolify Dashboard
Project → Logs → Select service (backend/frontend/mongodb/redis)

# Monitor resources
Project → Metrics
```

## Backups

Set up automatic MongoDB backups:

```bash
1. Project → mongodb service → Backups
2. Choose backup method:
   - S3 (recommended)
   - Local storage
3. Set schedule (e.g., daily at 2 AM)
4. Save
```

## Need Help?

- 📖 [Full Deployment Guide](./DEPLOYMENT.md)
- 🔧 [Coolify Documentation](https://coolify.io/docs)
- 💬 [Coolify Discord](https://discord.gg/coolify)

## Estimated Costs

| Provider | Server Type | Monthly Cost |
|----------|-------------|--------------|
| Hetzner | CPX31 (4 vCPU, 8GB RAM) | €10-15 |
| DigitalOcean | Droplet (4GB RAM) | $24 |
| Vultr | High Frequency (4GB) | $24 |

**Plus domain:** ~$10-15/year

**Total:** €10-30/month (vs $100-200/month for traditional cloud!)

---

**Ready to deploy?** Start with Step 1 above! 🚀
