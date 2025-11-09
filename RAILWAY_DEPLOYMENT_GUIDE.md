# Railway Deployment Guide

## Prerequisites

Before setting up Railway infrastructure, ensure you have:

- [ ] GitHub account with repository access
- [ ] Railway account (https://railway.app)
- [ ] MongoDB Atlas account (for MongoDB integration)
- [ ] Upstash account (optional, for serverless Redis)
- [ ] Team access to manage secrets

## Step 1: Create Railway Project

### 1.1 Access Railway Dashboard

1. Go to https://dashboard.railway.app
2. Sign in with GitHub account
3. Click "Create a new project"

### 1.2 Link GitHub Repository

1. Select "Deploy from GitHub repo"
2. Authorize Railway to access GitHub
3. Choose the repository
4. Select branch: `main`
5. Click "Deploy"

### 1.3 Create Project Structure

```bash
# Project Name: MVP Monorepo
# Description: Multi-service MVP application
# Region: Preferably closest to users or use: us-east-1
```

## Step 2: Create Environments

### 2.1 Development Environment

```bash
# In Railway Dashboard:
# 1. Click "+ New Environment"
# 2. Name: development
# 3. Base: main branch
# 4. Deploy on push: Enabled
# 5. Branch: develop

# Environment Variables (Development):
NODE_ENV=development
DEBUG=true
LOG_LEVEL=debug
WORKER_CONCURRENCY=2
```

### 2.2 Staging Environment

```bash
# 1. Click "+ New Environment"
# 2. Name: staging
# 3. Base: main branch
# 4. Deploy on push: Enabled
# 5. Branch: staging

# Environment Variables (Staging):
NODE_ENV=staging
DEBUG=false
LOG_LEVEL=info
WORKER_CONCURRENCY=4
```

### 2.3 Production Environment

```bash
# 1. Click "+ New Environment"
# 2. Name: production
# 3. Base: main branch
# 4. Deploy on push: Enabled
# 5. Branch: main
# 6. Enable "Production" toggle

# Environment Variables (Production):
NODE_ENV=production
DEBUG=false
LOG_LEVEL=warn
WORKER_CONCURRENCY=8
```

## Step 3: Deploy PostgreSQL

### 3.1 Add PostgreSQL to Development

1. In Development environment
2. Click "+ New Service"
3. Select "Database" → "PostgreSQL"
4. Configure:
   - **Version:** 15
   - **Plan:** Starter ($5/month)
   - **Size:** 1GB

5. Wait for deployment to complete
6. Copy connection string from "Connect"

### 3.2 Add PostgreSQL to Staging

Repeat Step 3.1 for Staging environment:
- Version: 15
- Plan: Standard ($15/month)
- Size: 5GB

### 3.3 Add PostgreSQL to Production

Repeat Step 3.1 for Production environment:
- Version: 15
- Plan: Premium ($25/month)
- Size: 20GB
- Enable "High Availability"
- Enable "Automated Backups"

### 3.4 Set Database Environment Variables

For each environment:

```bash
# Development
DATABASE_URL=postgresql://[user]:[password]@[host]:5432/[database]?sslmode=require

# Staging
DATABASE_URL=postgresql://[user]:[password]@[host]:5432/[database]?sslmode=require

# Production (with replication)
DATABASE_URL=postgresql://[user]:[password]@[host]:5432/[database]?sslmode=require&replication=true
```

## Step 4: Deploy Redis

### 4.1 Add Redis to Development

1. In Development environment
2. Click "+ New Service"
3. Select "Cache" → "Redis"
4. Configure:
   - **Version:** 7
   - **Plan:** Starter ($3/month)
   - **Memory:** 128MB
   - **Persistence:** Disabled (cost optimization)

### 4.2 Add Redis to Staging

Repeat for Staging environment:
- Version: 7
- Plan: Standard ($8/month)
- Memory: 512MB
- Persistence: Daily snapshots

### 4.3 Add Redis to Production

Repeat for Production environment:
- Version: 7
- Plan: Premium ($12/month)
- Memory: 2GB
- Persistence: AOF + RDB (real-time)
- Eviction Policy: allkeys-lru
- Maxmemory Policy: allkeys-lru

### 4.4 Set Redis Environment Variables

```bash
# For each environment:
REDIS_URL=redis://:[password]@[host]:[port]/0

# Production (with SSL):
REDIS_URL=redis://:[password]@[host]:[port]/0?ssl=true
```

## Step 5: Configure MongoDB Atlas

### 5.1 Create MongoDB Atlas Cluster

1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Create" → "New Project"
3. Name: "MVP MongoDB"
4. Select free tier ($0/month)
5. Choose AWS region
6. Click "Create Cluster"

### 5.2 Create Database User

1. Go to "Database Access"
2. Click "Add Database User"
3. Username: `dev_user` (or environment-specific)
4. Password: (generate strong password)
5. Database: `admin`
6. Roles: "Atlas Admin" for dev, "Custom Role" for prod
7. Create User

### 5.3 Create Database

1. Go to "Databases"
2. Click "Browse Collections"
3. Create Database:
   - Name: `mvp_dev`
   - Collection: `system_metadata`

### 5.4 Get Connection String

1. Click "Connect"
2. Select "Connect your application"
3. Copy connection string
4. Format: `mongodb+srv://user:password@cluster.mongodb.net/database?retryWrites=true&w=majority`

### 5.5 Set Environment Variables

```bash
# For each environment:
MONGODB_URI=mongodb+srv://[user]:[password]@[cluster].mongodb.net/[database]?retryWrites=true&w=majority
```

## Step 6: Configure Secrets

### 6.1 Generate Secrets

```bash
# Generate strong secrets using openssl or Node.js:

# JWT Secret (64 characters)
openssl rand -base64 48

# API Key Secret
openssl rand -base64 48

# Encryption Key
openssl rand -base64 32

# Session Secret
openssl rand -base64 32
```

### 6.2 Add Secrets to Development

In Development environment, add to Variables:

```
JWT_SECRET=[generated-secret]
API_KEY_SECRET=[generated-secret]
ENCRYPTION_KEY=[generated-secret]
SESSION_SECRET=[generated-secret]
SENTRY_DSN=
```

### 6.3 Add Secrets to Staging

Add the same secrets (or rotate if desired):

```
JWT_SECRET=[unique-staging-secret]
API_KEY_SECRET=[unique-staging-secret]
ENCRYPTION_KEY=[unique-staging-secret]
SESSION_SECRET=[unique-staging-secret]
SENTRY_DSN=[staging-sentry-dsn]
```

### 6.4 Add Secrets to Production

Add unique, strong secrets for production:

```
JWT_SECRET=[strong-production-secret]
JWT_REFRESH_SECRET=[strong-production-secret]
API_KEY_SECRET=[strong-production-secret]
ENCRYPTION_KEY=[strong-production-secret]
ENCRYPTION_KEY_BACKUP=[backup-key]
SESSION_SECRET=[strong-production-secret]
SENTRY_DSN=[production-sentry-dsn]
```

## Step 7: Configure Deployment Settings

### 7.1 Development Deployment

1. Select Development environment
2. Go to "Deployments"
3. Configure:
   - **Restart Policy:** On Failure
   - **Restart Limit:** 3 retries
   - **Memory:** 512MB
   - **CPU:** 0.5 vCPU

### 7.2 Staging Deployment

1. Select Staging environment
2. Configure:
   - **Restart Policy:** On Failure
   - **Restart Limit:** 5 retries
   - **Instances:** 2 (load balanced)
   - **Memory:** 1GB
   - **CPU:** 1 vCPU
   - **Enable Health Check:** Yes

### 7.3 Production Deployment

1. Select Production environment
2. Configure:
   - **Restart Policy:** On Failure
   - **Restart Limit:** 5 retries with 30s delay
   - **Instances:** 2 (blue-green)
   - **Memory:** 2GB
   - **CPU:** 1.5 vCPU
   - **Enable Health Check:** Yes
   - **Health Check Path:** `/health`
   - **Health Check Interval:** 30 seconds
   - **Health Check Timeout:** 5 seconds
   - **Deployment Strategy:** Blue-Green

## Step 8: Configure Health Checks

### 8.1 Development Health Check

Health checks are optional for development:

```
Disabled (for faster iteration)
```

### 8.2 Staging Health Check

```
Enabled
Path: /health
Interval: 30 seconds
Timeout: 5 seconds
Healthy Threshold: 2 consecutive successes
Unhealthy Threshold: 3 consecutive failures
```

### 8.3 Production Health Check

```
Enabled
Path: /health
Interval: 30 seconds
Timeout: 5 seconds
Healthy Threshold: 2 consecutive successes
Unhealthy Threshold: 3 consecutive failures
Grace Period: 40 seconds (allow time for startup)
```

## Step 9: Test Deployments

### 9.1 Development Test

```bash
# 1. Push to develop branch
git push origin develop

# 2. Monitor Railway logs
railway logs --follow

# 3. Test endpoint
curl https://dev-api.railway.app/health

# 4. Expected response:
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "checks": {
    "database": "healthy",
    "redis": "healthy"
  }
}
```

### 9.2 Staging Test

```bash
# 1. Push to staging branch
git push origin staging

# 2. Run database migrations
railway run npm run migrate

# 3. Test endpoints
curl https://staging-api.railway.app/health

# 4. Load test
ab -n 1000 -c 10 https://staging-api.railway.app/
```

### 9.3 Production Test (Blue-Green)

```bash
# 1. Push to main branch (or trigger manually)
git push origin main

# 2. Monitor in Railway Dashboard
# - Watch "Deployments" tab
# - Observe GREEN deployment
# - Confirm health checks pass
# - Verify traffic switch to GREEN
# - Old BLUE remains for 2-hour rollback window

# 3. Test production endpoint
curl https://api.example.com/health

# 4. Monitor metrics
# - Watch error rate
# - Monitor response latency
# - Check database connection pool
```

## Step 10: Configure Monitoring

### 10.1 Enable Sentry Integration

1. Go to https://sentry.io
2. Create project for each environment
3. Get DSN for each project
4. Add to environment variables:

```
SENTRY_DSN_DEV=[dev-sentry-dsn]
SENTRY_DSN_STAGING=[staging-sentry-dsn]
SENTRY_DSN_PROD=[prod-sentry-dsn]
```

### 10.2 Set Up Alerts

In Railway Dashboard:

1. Go to "Settings" → "Alerts"
2. Create alert for:
   - Deployment failures
   - High CPU usage (> 80%)
   - High memory usage (> 80%)
   - Health check failures

### 10.3 Configure Notifications

1. Connect Slack channel
2. Set up notifications for:
   - Successful deployments
   - Failed deployments
   - Errors and exceptions
   - Performance alerts

## Step 11: Database Migrations

### 11.1 Development Migrations

```bash
# Locally test migrations
npm run migrate

# Or run in Railway container
railway run npm run migrate
```

### 11.2 Staging Migrations

```bash
# Staging migrations run automatically with deployment
# Can also run manually:
railway env select staging
railway run npm run migrate

# Verify migration success
railway logs | grep -i migrate
```

### 11.3 Production Migrations

```bash
# Production migrations run automatically with deployment
# Run before traffic switch in blue-green deployment

# If needed, run manually:
railway env select production
railway run npm run migrate

# Verify database state
railway run npm run db:verify
```

## Step 12: Documentation & Handoff

### 12.1 Document Connection Strings

Save (securely) the connection strings for:
- PostgreSQL endpoints (dev, staging, prod)
- Redis endpoints (dev, staging, prod)
- MongoDB Atlas cluster connection

### 12.2 Document Access Procedures

Create runbook for team:
- How to access Railway Dashboard
- How to view logs
- How to trigger deployments
- How to rollback deployments
- How to rotate credentials

### 12.3 Team Training

- [ ] Show team Railway dashboard navigation
- [ ] Explain deployment process
- [ ] Review blue-green strategy
- [ ] Document incident response
- [ ] Set up on-call rotation

## Troubleshooting

### Deployment Fails to Start

**Symptoms:** Deployment shows error, app won't start

**Solutions:**
1. Check logs: `railway logs --follow`
2. Verify all environment variables are set
3. Verify database is accessible
4. Check Redis is running
5. Review application startup code

### Database Connection Errors

**Symptoms:** Connection refused, authentication failed

**Solutions:**
1. Verify CONNECTION_STRING format
2. Check database user has permissions
3. Verify database is running (check Railway dashboard)
4. Check firewall allows Railway app to DB
5. Test connection locally with psql

### Health Check Failures

**Symptoms:** Deployment gets stuck on health check

**Solutions:**
1. Increase health check grace period
2. Check `/health` endpoint returns 200
3. Verify all dependencies initialized
4. Review startup logs for errors
5. Increase timeout if migrations slow

### Blue-Green Deployment Stuck

**Symptoms:** GREEN never receives traffic

**Solutions:**
1. Check health check passes on GREEN
2. Verify database migrations completed
3. Review GREEN logs for startup errors
4. Check if there's a stale BLUE deployment
5. Manually rollback if needed

## References

- [Railway Documentation](https://docs.railway.app)
- [Railway CLI](https://docs.railway.app/cli/command-reference)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
- [MongoDB Connection Strings](https://docs.mongodb.com/manual/reference/connection-string/)
- [Redis Connections](https://redis.io/docs/management/client-connections/)
