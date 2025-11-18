# Deployment Guide

This guide covers deploying Vibex to production.

## Deployment Options

### Option 1: AWS (Recommended)

#### Backend (AWS EC2 + RDS)
```bash
# 1. Create EC2 instance (Ubuntu 22.04)
# 2. Install Node.js and dependencies
# 3. Set up MongoDB Atlas or AWS DocumentDB
# 4. Configure environment variables
# 5. Set up PM2 for process management

# Install PM2
npm install -g pm2

# Start backend
cd backend
pm2 start src/server.js --name vibex-api

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Frontend (Vercel)
```bash
cd frontend

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Option 2: Docker Deployment

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Scale backend
docker-compose -f docker-compose.prod.yml scale backend=3
```

### Option 3: Kubernetes

```bash
# Build and push images
docker build -t your-registry/vibex-backend:latest ./backend
docker build -t your-registry/vibex-frontend:latest ./frontend
docker push your-registry/vibex-backend:latest
docker push your-registry/vibex-frontend:latest

# Apply Kubernetes configs
kubectl apply -f k8s/
```

## Environment Setup

### Production Environment Variables

```env
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/vibex
REDIS_URL=redis://production-redis:6379

# Security
JWT_SECRET=<generate-strong-secret>
JWT_EXPIRES_IN=7d

# API Keys
OPENAI_API_KEY=<your-key>
TWITTER_BEARER_TOKEN=<your-token>

# AWS
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
AWS_REGION=us-east-1
AWS_S3_BUCKET=vibex-media
```

## Chrome Extension Deployment

### 1. Build for Production
```bash
cd extension
npm run build
```

### 2. Create ZIP
```bash
cd dist
zip -r vibex-extension.zip .
```

### 3. Publish to Chrome Web Store
1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pay one-time developer fee ($5)
3. Upload ZIP file
4. Fill in store listing details
5. Submit for review

## SSL/TLS Setup

### Using Let's Encrypt (Certbot)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.vibex.com

# Auto-renewal
sudo certbot renew --dry-run
```

## Monitoring & Logging

### PM2 Monitoring
```bash
# View logs
pm2 logs

# Monitor
pm2 monit

# Dashboard
pm2 plus
```

### Application Monitoring
- Set up Sentry for error tracking
- Use DataDog or New Relic for APM
- Configure CloudWatch for AWS

## Backup Strategy

### Database Backups
```bash
# MongoDB backup script
mongodump --uri="$MONGODB_URI" --out=/backups/$(date +%Y%m%d)

# Automate with cron
0 2 * * * /usr/local/bin/backup-mongo.sh
```

## Security Checklist

- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set secure HTTP headers (Helmet.js)
- [ ] Enable rate limiting
- [ ] Use strong JWT secrets
- [ ] Sanitize user inputs
- [ ] Enable MongoDB authentication
- [ ] Set up firewall rules
- [ ] Regular security updates
- [ ] Environment variable encryption

## Performance Optimization

### Backend
- Enable Redis caching
- Use connection pooling
- Implement pagination
- Optimize database queries
- Enable gzip compression

### Frontend
- Enable code splitting
- Optimize images
- Use CDN for static assets
- Enable browser caching
- Minimize bundle size

## Cost Optimization

### AWS Cost Estimate (Monthly)
- EC2 t3.medium: $30
- MongoDB Atlas M10: $57
- S3 Storage (100GB): $2.30
- CloudFront CDN: $5-20
- **Total: ~$100-110/month**

### Alternative Low-Cost Options
- **Railway**: $5-20/month
- **Render**: $7-25/month
- **DigitalOcean**: $12-50/month

## Scaling Strategy

### Horizontal Scaling
```bash
# Add more backend instances
docker-compose scale backend=5

# Load balancer (Nginx)
upstream backend {
    server backend1:5000;
    server backend2:5000;
    server backend3:5000;
}
```

### Database Scaling
- MongoDB sharding for large datasets
- Read replicas for analytics
- Redis clustering for caching

## CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy Backend
        run: |
          ssh user@server 'cd /app && git pull && pm2 restart all'
      - name: Deploy Frontend
        run: vercel --prod
```

## Rollback Procedure

```bash
# PM2 rollback
pm2 delete vibex-api
pm2 start src/server.js --name vibex-api

# Docker rollback
docker-compose down
docker-compose up -d --force-recreate
```

## Health Checks

```bash
# Backend health
curl https://api.vibex.com/health

# Frontend health
curl https://vibex.com

# Extension check
# Visit Chrome Web Store page
```

## Post-Deployment

1. Test all features in production
2. Monitor error rates
3. Check performance metrics
4. Verify backups are running
5. Update DNS records
6. Configure analytics
7. Set up status page

## Support

For deployment issues:
- Check logs: `pm2 logs`
- Monitor resources: `pm2 monit`
- Database status: `mongosh --eval "db.serverStatus()"`
