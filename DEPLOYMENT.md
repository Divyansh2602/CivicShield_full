# CivicShield AI - Deployment Guide

This guide covers deploying the CivicShield AI frontend to production environments.

## Prerequisites

- Node.js 18+ installed
- Access to backend server (production URL)
- Environment variables configured
- Git repository setup (optional but recommended)

## Deployment Options

### Option 1: Vercel (Recommended) ⭐

Vercel is the creator of Next.js and provides the best experience for Next.js deployments.

#### Setup
1. **Create Vercel Account**
   - Visit [vercel.com](https://vercel.com)
   - Sign up with GitHub/GitLab/Bitbucket or email

2. **Connect Repository**
   - Click "New Project"
   - Select your repository
   - Vercel auto-detects Next.js settings

3. **Configure Environment Variables**
   ```
   BACKEND_URL=https://your-backend-api.com
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel builds and deploys automatically
   - Get a production URL instantly

#### Automatic Deployments
- Pushes to main branch auto-deploy
- Pull requests get preview URLs
- Rollback to previous deployments anytime

#### Monitoring
- Built-in analytics
- Performance monitoring
- Error tracking
- Usage statistics

---

### Option 2: AWS (Amplify)

Deploy to AWS with Amplify for enterprise deployments.

#### Setup
1. **Install AWS Amplify CLI**
   ```bash
   npm install -g @aws-amplify/cli
   ```

2. **Initialize Amplify**
   ```bash
   amplify init
   ```

3. **Connect GitHub Repository**
   - Follow CLI prompts
   - Authenticate with GitHub
   - Select repository and branch

4. **Configure Environment Variables**
   ```bash
   amplify env add
   ```

5. **Deploy**
   ```bash
   amplify publish
   ```

#### Features
- Automatic CI/CD
- Unlimited deployments
- Custom domains
- SSL certificates
- Built-in monitoring

---

### Option 3: Google Cloud Run

Deploy containerized Next.js app to Google Cloud.

#### Dockerfile
Create `Dockerfile` in project root:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### Deployment
```bash
# Build image
docker build -t civicshield .

# Push to Google Cloud
gcloud builds submit --tag gcr.io/PROJECT_ID/civicshield

# Deploy
gcloud run deploy civicshield \
  --image gcr.io/PROJECT_ID/civicshield \
  --platform managed \
  --set-env-vars BACKEND_URL=https://your-backend.com
```

---

### Option 4: DigitalOcean App Platform

Simple deployment with automatic scaling.

#### Setup
1. **Push to GitHub**
   - Repository must be on GitHub

2. **Connect to DigitalOcean**
   - Log in to DigitalOcean
   - Click "Create" → "App"
   - Select GitHub repository

3. **Configure**
   - Set environment variables
   - Configure port 3000
   - Set build command: `npm run build`
   - Set run command: `npm start`

4. **Deploy**
   - Click "Create Resources"
   - Wait for deployment

---

### Option 5: Heroku

Quick deployment for small projects.

#### Setup
```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create civicshield

# Set environment variables
heroku config:set BACKEND_URL=https://your-backend.com

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

#### Procfile
Create `Procfile`:
```
web: npm start
```

---

### Option 6: Self-Hosted

Deploy to your own server.

#### Requirements
- Linux server with Node.js 18+
- Nginx or Apache reverse proxy
- SSL certificate
- SSH access

#### Setup
```bash
# SSH into server
ssh user@your-server.com

# Clone repository
git clone https://github.com/your-repo.git
cd civicshield

# Install dependencies
npm install

# Build
npm run build

# Create .env.local
echo "BACKEND_URL=https://your-backend.com" > .env.local

# Install PM2 for process management
npm install -g pm2

# Start app with PM2
pm2 start "npm start" --name civicshield
pm2 save

# Create startup script
pm2 startup
```

#### Nginx Configuration
Create `/etc/nginx/sites-available/civicshield`:
```nginx
server {
    listen 80;
    server_name civicshield.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/civicshield /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### SSL with Let's Encrypt
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d civicshield.yourdomain.com
```

---

## Production Environment Variables

### Required
```
BACKEND_URL=https://your-production-backend.com
```

### Optional
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
NODE_ENV=production
```

## Pre-Deployment Checklist

- [ ] Backend URL configured correctly
- [ ] `.env.local` not committed to git
- [ ] All dependencies installed
- [ ] Production build tested locally: `npm run build && npm start`
- [ ] All pages accessible and functional
- [ ] API routes work correctly
- [ ] Forms validate input properly
- [ ] Error handling implemented
- [ ] Performance optimized (bundle size, images)
- [ ] Security headers configured
- [ ] SSL certificate valid
- [ ] CORS properly configured on backend

## Performance Optimization

### Build Optimization
```javascript
// next.config.js
module.exports = {
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  swcMinify: true,
}
```

### Image Optimization
- Use Next.js Image component
- Implement responsive images
- Enable image caching

### Bundle Analysis
```bash
npm install --save-dev @next/bundle-analyzer
```

### CDN Configuration
- Configure CDN for static assets
- Cache images and fonts
- Set proper cache headers

## Monitoring & Maintenance

### Application Monitoring
- Set up error tracking (Sentry, LogRocket)
- Monitor performance metrics
- Track user analytics

### Health Checks
```bash
# Check if app is running
curl https://civicshield.yourdomain.com
```

### Logging
- Log API errors
- Monitor backend connectivity
- Track scan execution

### Updates
```bash
# Update dependencies
npm update

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

## Rollback Procedures

### Vercel
1. Go to Deployments
2. Click the deployment to rollback to
3. Click "Promote to Production"

### GitHub Actions
1. Revert commit: `git revert <commit>`
2. Push to main branch
3. Automatic redeploy triggers

### Manual Rollback
```bash
git log --oneline
git checkout <previous-commit>
git push origin HEAD --force
```

## Scaling Considerations

### Horizontal Scaling
- Multiple frontend instances behind load balancer
- Sticky sessions for stateful operations
- Shared environment variables

### Vertical Scaling
- Increase server resources
- Optimize code and dependencies
- Enable caching

### Database Scaling
- If using Supabase, configure replicas
- Implement connection pooling
- Monitor query performance

## Security Checklist

- [ ] HTTPS only (no HTTP)
- [ ] Security headers configured
- [ ] CORS properly restricted
- [ ] API keys in environment variables
- [ ] Backend authentication enabled
- [ ] Rate limiting implemented
- [ ] Input validation on frontend
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented
- [ ] Content Security Policy configured

## Troubleshooting

### App Won't Start
```bash
# Check Node version
node --version  # Should be 18+

# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### Backend Connection Error
- Verify `BACKEND_URL` is correct
- Check backend is running
- Verify CORS headers on backend
- Check firewall rules

### High Memory Usage
- Check for memory leaks
- Monitor polling intervals
- Optimize state management
- Implement pagination

### Slow Performance
- Run `npm run build` and check output
- Enable compression
- Use CDN for static files
- Optimize images

### Build Failures
- Check Node version compatibility
- Verify all dependencies installed
- Clear npm cache: `npm cache clean --force`
- Check for circular dependencies

## Monitoring Commands

```bash
# CPU and Memory usage
top
ps aux | grep node

# Network connections
netstat -tulpn

# Logs
journalctl -u civicshield -f
tail -f /var/log/app.log

# Disk usage
df -h
du -sh /path/to/app

# Process health
pm2 status
pm2 logs civicshield
```

## Backup Strategy

- Regular backups of `.env.local` (secure location)
- Version control for code
- Database backups if using Supabase
- Regular deployment snapshots

## Cost Estimation

| Provider | Free Tier | Starter | Production |
|----------|-----------|---------|------------|
| Vercel | 100GB bandwidth | $20/mo | Custom |
| AWS Amplify | 1000 build mins | Pay per use | Pay per use |
| DigitalOcean | - | $5/mo | $100+/mo |
| Heroku | - | $7/mo | $50+/mo |
| Self-hosted | - | $5-20/mo | $20-100/mo |

## Recommended Setup

**For Development**: Vercel Preview deployments
**For Production**: Vercel or DigitalOcean App Platform
**For Enterprise**: AWS Amplify or Self-hosted with Kubernetes

## Post-Deployment

1. **Smoke Tests**
   - Test landing page loads
   - Start a scan
   - Check dashboard updates
   - Download a report

2. **Monitor Performance**
   - Check Core Web Vitals
   - Monitor error rates
   - Track API response times

3. **User Testing**
   - Have users test scanning workflow
   - Gather feedback
   - Fix issues

4. **Documentation**
   - Document deployment process
   - Create runbook
   - Set up alerts

## Support & Maintenance

### Regular Tasks
- Weekly log review
- Monthly security updates
- Quarterly dependency updates
- Annual architecture review

### Emergency Response
- Documented incident procedures
- Rollback procedures
- Communication plan
- Post-incident review

## Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [AWS Amplify Guide](https://docs.amplify.aws/)
- [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform/)

---

## Quick Deploy Commands

### Vercel
```bash
vercel --prod
```

### DigitalOcean
```bash
doctl apps create --spec app.yaml
```

### AWS Amplify
```bash
amplify publish --yes
```

### Self-hosted
```bash
pm2 restart civicshield
pm2 save
```

---

## Summary

Choose your deployment platform based on:
- **Quick Setup**: Vercel or DigitalOcean App Platform
- **Enterprise**: AWS Amplify or Self-hosted
- **Maximum Control**: Self-hosted on VPS
- **Best for Next.js**: Vercel

All options are production-ready and can handle enterprise workloads with proper configuration.
