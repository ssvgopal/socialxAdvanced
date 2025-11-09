# Railway Infrastructure Setup Guide

## Overview

This document describes the Railway infrastructure setup for the MVP monorepo application. The architecture includes managed Postgres and Redis databases, MongoDB Atlas integration, and zero-downtime blue-green deployments across development, staging, and production environments.

## Project Structure

### Environments

The project is configured with three distinct environments:

1. **Development** - For feature development and testing
   - Smaller resource allocation
   - All features enabled for testing
   - Deployed on push to `develop` branch

2. **Staging** - Pre-production testing environment
   - Production-like configuration
   - Performance and integration testing
   - Deployed on push to `staging` branch

3. **Production** - Live environment
   - Full resource allocation
   - High availability configuration
   - Deployed on push to `main` branch
   - Blue-green deployments enabled

## Services Configuration

### PostgreSQL Database

- **Managed by:** Railway
- **Version:** PostgreSQL 15
- **Availability:** All environments
- **Backups:** Automated daily snapshots (7-day retention in dev, 30-day in prod)
- **High Availability:** Enabled in production environment

#### Connection Details

| Environment | Connection String Format |
|---|---|
| Development | `postgresql://[user]:[password]@[host]:5432/[database]?sslmode=require` |
| Staging | `postgresql://[user]:[password]@[host]:5432/[database]?sslmode=require` |
| Production | `postgresql://[user]:[password]@[host]:5432/[database]?sslmode=require&replication=true` |

### Redis Cache

- **Managed by:** Railway
- **Version:** Redis 7
- **Availability:** All environments
- **Persistence:** RDB snapshots (development only for cost optimization)
- **Maxmemory Policy:** `allkeys-lru` (production), `volatile-lru` (dev/staging)

#### Connection Details

| Environment | Connection String Format |
|---|---|
| Development | `redis://:[password]@[host]:6379/0` |
| Staging | `redis://:[password]@[host]:6379/0` |
| Production | `redis://:[password]@[host]:6379/0?ssl=true` |

### MongoDB Atlas

- **Managed by:** MongoDB Atlas (free tier)
- **Version:** Latest community server
- **Location:** AWS (auto-selected region)
- **Backups:** Point-in-time recovery enabled

#### Connection Details

| Environment | Connection String Format |
|---|---|
| Development | `mongodb+srv://[user]:[password]@[cluster].mongodb.net/[database]?retryWrites=true&w=majority` |
| Staging | `mongodb+srv://[user]:[password]@[cluster].mongodb.net/[database]?retryWrites=true&w=majority` |
| Production | `mongodb+srv://[user]:[password]@[cluster].mongodb.net/[database]?retryWrites=true&w=majority&replicaSet=atlas-cluster` |

### Upstash (Optional)

- **Managed by:** Upstash
- **Type:** Serverless Redis
- **Use Case:** Optional high-performance caching or job queue
- **Free Tier:** Supported with usage limits

## Environment Variables & Secrets

### Variable Management

All secrets and sensitive configuration are stored in Railway's encrypted vault. Variables are injected at deployment time and never exposed in logs or version control.

### Development Environment

```env
# Database
DATABASE_URL=postgresql://[dev-user]:[dev-password]@localhost:5432/mvp_dev
MONGODB_URI=mongodb+srv://[dev-user]:[dev-password]@dev-cluster.mongodb.net/mvp_dev
REDIS_URL=redis://:[dev-password]@localhost:6379/0

# Application
NODE_ENV=development
DEBUG=true
LOG_LEVEL=debug

# Services
API_PORT=3000
WORKER_CONCURRENCY=2
```

### Staging Environment

```env
# Database
DATABASE_URL=postgresql://[staging-user]:[staging-password]@staging-db.railway.app:5432/mvp_staging
MONGODB_URI=mongodb+srv://[staging-user]:[staging-password]@staging-cluster.mongodb.net/mvp_staging
REDIS_URL=redis://:[staging-password]@staging-redis.railway.app:6379/0

# Application
NODE_ENV=staging
DEBUG=false
LOG_LEVEL=info

# Services
API_PORT=3000
WORKER_CONCURRENCY=4
```

### Production Environment

```env
# Database
DATABASE_URL=postgresql://[prod-user]:[prod-password]@prod-db.railway.app:5432/mvp_production
MONGODB_URI=mongodb+srv://[prod-user]:[prod-password]@prod-cluster.mongodb.net/mvp_production
REDIS_URL=redis://:[prod-password]@prod-redis.railway.app:6379/0?ssl=true

# Application
NODE_ENV=production
DEBUG=false
LOG_LEVEL=warn

# Services
API_PORT=3000
WORKER_CONCURRENCY=8

# Security
JWT_SECRET=[secure-random-secret]
API_KEY_SECRET=[secure-random-secret]
ENCRYPTION_KEY=[secure-random-secret]

# Monitoring
SENTRY_DSN=[sentry-project-dsn]
```

## Deployment Strategy: Blue-Green

### Overview

Blue-green deployments enable zero-downtime updates by maintaining two identical production environments:

- **Blue:** Current production environment (active)
- **Green:** New version ready to receive traffic

### Process

1. **Deploy to Green:**
   - Application is built and deployed to the green environment
   - All tests run against the green environment
   - Health checks verify the green environment is ready

2. **Health Check Validation:**
   - Application endpoint: `/health`
   - Database connectivity check
   - Cache connectivity check
   - External service checks

3. **Switch Traffic:**
   - Load balancer switches traffic from blue to green
   - Green becomes the new production (blue)
   - Rollback plan: Immediately switch back to blue if health checks fail

4. **Cleanup:**
   - Blue environment remains ready for rollback (2-hour window)
   - After successful validation, blue environment can be cleaned up

### Configuration

Health check endpoint should return:

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "checks": {
    "database": "healthy",
    "redis": "healthy",
    "mongodb": "healthy"
  },
  "version": "1.0.0"
}
```

### Rollback

Rollback to previous version within 2-hour window:

1. Switch traffic back to blue environment
2. Investigate failure in green environment
3. Review logs and error tracking
4. Deploy fix to green and re-test

## Health Checks

### Endpoint Configuration

**Path:** `/health`  
**Method:** GET  
**Timeout:** 5 seconds  
**Interval:** 30 seconds  
**Healthy Response:** HTTP 200 with JSON status

### Required Checks

- **Database Connection:**
  - PostgreSQL connectivity
  - Query execution test
  - Connection pool status

- **Cache Connection:**
  - Redis connectivity
  - Key/value operations test
  - Memory usage

- **External Services:**
  - MongoDB Atlas connectivity
  - Upstash (if configured) connectivity
  - External API health (if applicable)

## Credential Rotation

### Database Credentials

1. **Rotation Schedule:** Every 90 days (production), every 6 months (dev)
2. **Process:**
   - Generate new credentials in Railway dashboard
   - Create new secret version in secret manager
   - Update application configuration
   - Verify connectivity in staging first
   - Rotate in production during low-traffic window

### JWT & API Secrets

1. **Rotation Schedule:** Every 180 days or immediately on compromise
2. **Process:**
   - Generate new secret
   - Add as new version (keep old for grace period)
   - Update application to accept both old and new
   - After 24-hour grace period, disable old secret

### Procedure in Railway

```bash
# 1. Access Railway Dashboard
# 2. Navigate to Project > Environment > Variables
# 3. For each secret to rotate:
#    a. Generate new value
#    b. Create new variable with _v2 suffix if phased rollout needed
#    c. Deploy with new variable
#    d. Monitor for issues
#    e. Remove old variable after grace period
```

## Cost Optimization & Expectations

### MVP Stage Budget: $70-120/month

#### PostgreSQL Costs
- **Development:** $5/month (1GB storage, minimal compute)
- **Staging:** $15/month (5GB storage, standard compute)
- **Production:** $25/month (20GB storage, HA enabled)

#### Redis Costs
- **Development:** $3/month (128MB, no persistence)
- **Staging:** $8/month (512MB, snapshot persistence)
- **Production:** $12/month (2GB, snapshot + AOF persistence)

#### MongoDB Atlas Costs
- **Free Tier:** $0/month (512MB storage, 100 connections)
  - Suitable for MVP development
  - Upgrade as needed when approaching limits

#### Upstash Costs (Optional)
- **Free Tier:** $0/month (10,000 commands/day)
- **Pro:** $7-25/month based on usage

#### Application Deployment
- **Railway Free Tier:** Up to 5 projects, 500 hours/month
- **Paid Deployment:** $5/month per active application
- **Autoscaling:** Scales with load, additional compute as needed

#### Total Estimated Costs

| Component | Development | Staging | Production | Total |
|---|---|---|---|---|
| PostgreSQL | $5 | $15 | $25 | $45 |
| Redis | $3 | $8 | $12 | $23 |
| MongoDB Atlas | $0 | $0 | $0 | $0 |
| Application | $0 | $0 | $5 | $5 |
| **Total** | **$8** | **$23** | **$42** | **$73** |

### Cost Optimization Tips

1. **Development Environment:**
   - Use smaller instance sizes
   - Disable backups outside business hours
   - Consider shared database instance for low-traffic services

2. **Staging Environment:**
   - Scale down to production-like but smaller instances
   - Use automated cleanup scripts for test data

3. **Production Environment:**
   - Enable auto-scaling for variable load
   - Use reserved resources for baseline capacity
   - Monitor and right-size instances monthly

## Monitoring & Logging

### Railway Dashboard

- **Real-time Logs:** View application output and system events
- **Metrics:** CPU, memory, network, request latency
- **Deployments:** History, status, rollback options

### Third-party Integration

- **Error Tracking:** Sentry integration for exception monitoring
- **Logging:** CloudWatch, Datadog, or Papertrail
- **Performance:** New Relic, Datadog APM

## Security Considerations

1. **Network Isolation:**
   - All services within Railway private network
   - Database only accessible from application
   - SSL/TLS for all external connections

2. **Secrets Management:**
   - Never commit secrets to version control
   - Use Railway environment variables for all sensitive data
   - Rotate credentials every 90 days

3. **Access Control:**
   - Team members have role-based access (viewer, deployer, admin)
   - GitHub integration validates pull requests before deployment
   - Audit logs for all changes

## Setup Checklist

- [ ] Create Railway project account
- [ ] Link GitHub repository to Railway project
- [ ] Create three environments (development, staging, production)
- [ ] Deploy PostgreSQL 15 to all environments
- [ ] Deploy Redis 7 to all environments
- [ ] Create MongoDB Atlas cluster and add connection string to secrets
- [ ] Configure environment variables for each environment
- [ ] Implement health check endpoint in application
- [ ] Configure blue-green deployment strategy
- [ ] Set up automated backups
- [ ] Test database migrations in each environment
- [ ] Document credential rotation procedures
- [ ] Set up monitoring and alerting
- [ ] Load test blue-green deployment process
- [ ] Train team on deployment procedures

## Troubleshooting

### Database Connection Issues

1. Check environment variables are correctly set
2. Verify database is in the same Railway private network
3. Check firewall rules allow application to database port
4. Review Railway logs for connection errors

### Blue-Green Deployment Failures

1. Check health endpoint returns 200 OK
2. Verify all required dependencies are available in green environment
3. Check database migrations completed successfully
4. Review application startup logs

### Performance Issues

1. Monitor CPU and memory usage in Railway dashboard
2. Check slow queries in database
3. Review cache hit rates in Redis
4. Consider increasing resource allocation

## References

- [Railway Documentation](https://docs.railway.app)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Blue-Green Deployments](https://martinfowler.com/bliki/BlueGreenDeployment.html)
