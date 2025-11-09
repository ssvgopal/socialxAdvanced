# Railway Infrastructure Setup

This repository contains comprehensive documentation and configuration for the MVP monorepo deployment on Railway, including managed PostgreSQL and Redis, MongoDB Atlas integration, and zero-downtime blue-green deployments.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Documentation](#documentation)
- [Setup Checklist](#setup-checklist)
- [Cost Summary](#cost-summary)
- [Support & Troubleshooting](#support--troubleshooting)

## 🚀 Quick Start

### Prerequisites

- [Railway Account](https://railway.app)
- [Railway CLI](https://docs.railway.app/cli/cli-reference)
- GitHub repository connected to Railway
- MongoDB Atlas account (free tier)

### 1. Install Railway CLI

```bash
npm install -g @railway/cli
```

### 2. Login to Railway

```bash
railway login
```

### 3. Initialize Project

```bash
railway init
# Select: Create a new project
# Name: MVP Monorepo
# Region: Preferably US (closest to users)
```

### 4. Follow Deployment Guide

See [RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md) for step-by-step setup.

## 🏗️ Architecture Overview

```
External Users
    ↓
Railway Router/Load Balancer
    ↓
  ┌─────────────────────────────┐
  │  Environments               │
  ├───────┬───────┬─────────────┤
  │  Dev  │ Stg   │ Production  │
  │       │       │  (Blue-Grn) │
  └───────┴───────┴─────────────┘
    ↓       ↓       ↓
  ┌─────────────────────────────┐
  │  Shared Services            │
  ├─────────┬─────────┬─────────┤
  │ PostgreSQL │  Redis   │ MongoDB │
  │ (20GB)     │  (2GB)   │ (Free)  │
  └───────────────────────────────┘
```

### Environments

- **Development:** Feature development, auto-deploys on `develop` push
- **Staging:** Pre-production testing, auto-deploys on `staging` push  
- **Production:** Live environment, blue-green deployment on `main` push

### Services

- **PostgreSQL 15:** Relational database (managed by Railway)
- **Redis 7:** Caching and sessions (managed by Railway)
- **MongoDB Atlas:** Document storage (managed by MongoDB)
- **Upstash:** Optional serverless Redis

## 📚 Documentation

### Core Documents

| Document | Purpose |
|----------|---------|
| [RAILWAY_SETUP.md](./RAILWAY_SETUP.md) | Main infrastructure guide with service configs and costs |
| [RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md) | Step-by-step deployment instructions |
| [BLUE_GREEN_DEPLOYMENT.md](./BLUE_GREEN_DEPLOYMENT.md) | Zero-downtime deployment strategy |
| [HEALTH_CHECK_IMPLEMENTATION.md](./HEALTH_CHECK_IMPLEMENTATION.md) | Health check code examples |

### Reference Documents

| Document | Purpose |
|----------|---------|
| [INFRASTRUCTURE_DIAGRAM.md](./INFRASTRUCTURE_DIAGRAM.md) | Visual architecture diagrams |
| [CREDENTIAL_ROTATION.md](./CREDENTIAL_ROTATION.md) | Credential rotation procedures |
| [COST_ANALYSIS.md](./COST_ANALYSIS.md) | Detailed cost breakdown and forecasting |
| [OPERATIONS_RUNBOOK.md](./OPERATIONS_RUNBOOK.md) | Common operational procedures |

### Configuration Files

| File | Purpose |
|------|---------|
| [railway.json](./railway.json) | Railway project configuration |
| [.env.example](./.env.example) | Base environment variables |
| [.env.development.example](./.env.development.example) | Development-specific variables |
| [.env.staging.example](./.env.staging.example) | Staging-specific variables |
| [.env.production.example](./.env.production.example) | Production-specific variables |

## ✅ Setup Checklist

### Phase 1: Initial Setup (2 days)

- [ ] Create Railway account
- [ ] Create MongoDB Atlas cluster
- [ ] Link GitHub repository to Railway
- [ ] Create development environment
- [ ] Deploy PostgreSQL to development
- [ ] Deploy Redis to development
- [ ] Configure environment variables
- [ ] Test local development setup

### Phase 2: Staging Environment (1 day)

- [ ] Create staging environment
- [ ] Deploy PostgreSQL to staging
- [ ] Deploy Redis to staging
- [ ] Configure environment variables
- [ ] Run database migrations
- [ ] Test health check endpoint

### Phase 3: Production Setup (2 days)

- [ ] Create production environment
- [ ] Deploy PostgreSQL with HA
- [ ] Deploy Redis with persistence
- [ ] Configure blue-green deployment
- [ ] Configure health checks
- [ ] Set up monitoring alerts
- [ ] Implement graceful shutdown

### Phase 4: Testing & Validation (1 day)

- [ ] Test database migrations
- [ ] Test health check endpoint
- [ ] Load test staging environment
- [ ] Perform blue-green deployment test
- [ ] Test rollback procedure
- [ ] Document any issues

### Phase 5: Documentation & Handoff (1 day)

- [ ] Document connection strings
- [ ] Create runbooks
- [ ] Train team on procedures
- [ ] Set up monitoring
- [ ] Plan credential rotation schedule

## 💰 Cost Summary

### MVP Baseline (Monthly)

| Component | Cost |
|-----------|------|
| PostgreSQL (Dev + Staging + Prod) | $45 |
| Redis (Dev + Staging + Prod) | $23 |
| MongoDB Atlas (Free Tier) | $0 |
| Application Deployment | $5 |
| **Total** | **$73** |

### Target Budget

- **MVP Stage:** $70-120/month
- **Growth Phase (3-6 months):** $150-200/month
- **Scale Phase (6+ months):** $300-500/month

See [COST_ANALYSIS.md](./COST_ANALYSIS.md) for detailed cost breakdown and optimization strategies.

## 🔐 Security

### Credential Management

- All secrets stored in Railway Secret Manager
- Automated credential rotation every 90 days
- See [CREDENTIAL_ROTATION.md](./CREDENTIAL_ROTATION.md)

### Deployment Security

- All deployments reviewed before merge to main
- Blue-green strategy enables instant rollback
- Health checks verify every deployment
- See [BLUE_GREEN_DEPLOYMENT.md](./BLUE_GREEN_DEPLOYMENT.md)

### Network Security

- All services within Railway private network
- SSL/TLS for all external connections
- Database only accessible from application
- See [INFRASTRUCTURE_DIAGRAM.md](./INFRASTRUCTURE_DIAGRAM.md)

## 📊 Monitoring

### Health Checks

Health checks run every 30 seconds and verify:
- PostgreSQL connectivity
- Redis connectivity
- MongoDB connectivity (if used)
- Application availability

### Alerts

Configure alerts for:
- High error rate (> 1%)
- High latency (> 1s p95)
- High resource usage (> 80%)
- Deployment failures

### Logs

- Development: View logs in Railway dashboard
- Staging: Use CloudWatch or similar
- Production: Sentry + CloudWatch integration

## 🆘 Support & Troubleshooting

### Common Issues

**Health Check Failing**
→ See "Troubleshooting" in [OPERATIONS_RUNBOOK.md](./OPERATIONS_RUNBOOK.md)

**Database Connection Error**
→ Check connection string in [RAILWAY_SETUP.md](./RAILWAY_SETUP.md)

**Blue-Green Deployment Stuck**
→ Review procedures in [BLUE_GREEN_DEPLOYMENT.md](./BLUE_GREEN_DEPLOYMENT.md)

**High Costs**
→ See cost optimization tips in [COST_ANALYSIS.md](./COST_ANALYSIS.md)

### Getting Help

1. **Documentation:** Check relevant document above
2. **Railway Docs:** https://docs.railway.app
3. **Community:** [Railway Discord](https://discord.gg/railway)
4. **Support:** [Railway Support](https://support.railway.app)

## 🔄 Deployment Flow

### Development
```
Push to develop → GitHub Webhook → Railway auto-deploys → Staging test
```

### Staging
```
Push to staging → GitHub Webhook → Railway auto-deploys → Load test
```

### Production (Blue-Green)
```
Push to main → GitHub Webhook → Build image → Deploy to GREEN
→ Run health checks → Switch traffic BLUE→GREEN → Monitor
→ Rollback available for 2 hours if needed
```

## 📅 Maintenance Schedule

### Daily
- [ ] Monitor application health
- [ ] Check error rates
- [ ] Verify backups completed

### Weekly
- [ ] Review cost trends
- [ ] Check resource utilization
- [ ] Review logs for patterns

### Monthly
- [ ] Full backup verification
- [ ] Cost reconciliation
- [ ] Performance analysis
- [ ] Security audit

### Quarterly
- [ ] Rotate credentials
- [ ] Update dependencies
- [ ] Disaster recovery drill
- [ ] Capacity planning

## 🚨 Incident Response

### For Production Issues

1. **Assess Severity:** Is service down? (P1 = immediate response)
2. **Identify Root Cause:** Check logs, metrics, deployments
3. **Mitigate:** Rollback or scale up as needed
4. **Communicate:** Update stakeholders
5. **Document:** Create incident ticket for post-mortem

See [OPERATIONS_RUNBOOK.md](./OPERATIONS_RUNBOOK.md) for detailed incident response procedures.

## 📖 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Blue-Green Deployments](https://martinfowler.com/bliki/BlueGreenDeployment.html)

## 📝 Contributing

When adding new infrastructure or changing deployment procedures:

1. Update relevant documentation
2. Test changes in development/staging first
3. Document any new services or costs
4. Update team runbooks
5. Schedule team training on changes

## 👥 Team

- **Infrastructure Lead:** [Team member]
- **Database Admin:** [Team member]
- **DevOps Engineer:** [Team member]
- **On-Call Rotation:** [See PagerDuty schedule]

## 📋 License

Internal documentation only. Do not share with external parties.

---

**Last Updated:** January 2024  
**Status:** ✅ Ready for MVP deployment  
**Next Review:** End of Q1 2024
