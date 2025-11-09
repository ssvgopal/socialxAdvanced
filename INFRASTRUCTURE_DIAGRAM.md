# Infrastructure Diagram

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          External Users / Clients                            │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │ HTTPS
                                     │
                        ┌────────────▼────────────┐
                        │   Railway Router/DNS    │
                        │  (Load Balancer)        │
                        └────────┬────────────────┘
                                 │
                  ┌──────────────┼──────────────┐
                  │              │              │
         ┌────────▼──────┐ ┌────▼──────┐ ┌────▼──────┐
         │ DEVELOPMENT   │ │ STAGING   │ │PRODUCTION │
         │  Environment  │ │Environment│ │Environment│
         └────────┬──────┘ └────┬──────┘ └────┬──────┘
                  │              │              │
        ┌─────────▼─────┐ ┌─────▼────┐ ┌──────▼──────┐
        │App Container  │ │App       │ │Blue-Green  │
        │(Single)       │ │Container │ │Deployment  │
        └─────────┬─────┘ │(2 inst)  │ │(2 inst)    │
                  │       └────┬────┘ └──────┬──────┘
                  │            │             │
        ┌─────────▼─────────────▼─────────────▼──────────────┐
        │            Shared Services Layer                    │
        │                                                     │
        │  ┌──────────────┐  ┌──────────┐  ┌────────────┐  │
        │  │ PostgreSQL   │  │  Redis   │  │ MongoDB    │  │
        │  │ (Database)   │  │ (Cache)  │  │ Atlas      │  │
        │  │              │  │          │  │ (Optional) │  │
        │  │ Dev: 1GB     │  │Dev: 128M │  │ Free Tier  │  │
        │  │ Stg: 5GB     │  │Stg: 512M │  │            │  │
        │  │ Prod: 20GB   │  │Prod: 2GB │  │            │  │
        │  └──────────────┘  └──────────┘  └────────────┘  │
        │                                                     │
        │  ┌──────────────────────────────────────────────┐  │
        │  │  Optional: Upstash (Serverless Redis)        │  │
        │  │  - High-performance caching                  │  │
        │  │  - Job queue support                         │  │
        │  │  - Free tier: 10k commands/day               │  │
        │  └──────────────────────────────────────────────┘  │
        └────────────────────────────────────────────────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
        ┌───────▼─────┐  ┌──────▼──────┐  ┌──────▼──────┐
        │ GitHub      │  │  Monitoring │  │  Analytics  │
        │ Repository  │  │  (Optional)  │  │  (Optional) │
        │ (Triggers)  │  │              │  │             │
        └─────────────┘  └──────────────┘  └─────────────┘
```

## Blue-Green Production Architecture

```
                        ┌──────────────────────┐
                        │  Load Balancer       │
                        │  (Traffic Routing)   │
                        └──────────┬───────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
            ┌───────▼────────┐ ┌──▼──────────┐
            │ BLUE (Active)  │ │ GREEN       │
            │ Current Prod   │ │(Standby)    │
            │                │ │             │
            │  - Instance 1  │ │ - Instance1 │
            │  - Instance 2  │ │ - Instance2 │
            │                │ │             │
            │ 100% traffic   │ │ 0% traffic  │
            └────────┬───────┘ └──┬──────────┘
                     │            │
                     │            │
        ┌────────────▼────────────▼──────────────┐
        │      Shared Data Layer                 │
        │                                        │
        │  PostgreSQL                            │
        │  └─ Single instance with replication   │
        │                                        │
        │  Redis                                 │
        │  └─ Single instance shared cache       │
        │                                        │
        │  MongoDB Atlas                         │
        │  └─ Cluster shared between all         │
        └────────────────────────────────────────┘

Deployment Process:
1. New code pushed to main
2. Build Docker image
3. Deploy to GREEN
4. Run health checks
5. If healthy: Switch traffic BLUE → GREEN
6. Previous BLUE → GREEN (standby)
7. Rollback window: 2 hours
```

## Environment-Specific Configurations

### Development Environment

```
Branch: develop
Auto-deploy: On every push
Strategy: Standard deployment
Instances: 1
Health check: None required
Restart policy: On failure (max 3 retries)
Database: Dev PostgreSQL (1GB)
Cache: Dev Redis (128MB, no persistence)
Cost: ~$8/month
```

### Staging Environment

```
Branch: staging
Auto-deploy: On every push
Strategy: Standard deployment
Instances: 2 (load balanced)
Health check: /health endpoint (30s interval)
Restart policy: On failure (max 5 retries)
Database: Staging PostgreSQL (5GB)
Cache: Staging Redis (512MB, daily snapshots)
Cost: ~$23/month
```

### Production Environment

```
Branch: main
Auto-deploy: On every push
Strategy: Blue-Green with health checks
Instances: 2 per environment (4 total)
Health check: /health endpoint (30s interval, strict)
Restart policy: On failure (max 5 retries, 30s delay)
Database: Production PostgreSQL (20GB, HA, backups)
Cache: Production Redis (2GB, AOF persistence)
Cost: ~$42/month
```

## Data Flow Diagram

```
User Request
    │
    ▼
┌─────────────────────────────────┐
│ Railway Load Balancer / DNS     │
└────────────┬────────────────────┘
             │
             ▼
    ┌────────────────────┐
    │  Application Layer │
    │  (Node.js, Python, │
    │   Go, etc.)        │
    └────────┬───────────┘
             │
    ┌────────┼────────┐
    │        │        │
    ▼        ▼        ▼
┌────────┐┌────────┐┌──────────┐
│  Read  ││ Cache  ││  Write   │
└────────┘└────────┘└──────────┘
    │        │          │
    ▼        ▼          ▼
┌──────────────────────────────┐
│   Shared Services            │
│                              │
│  PostgreSQL      Redis       │
│  (Primary Data)  (Cache)     │
│                              │
│  MongoDB Atlas               │
│  (Document Store)            │
└──────────────────────────────┘
```

## Network Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Internet                              │
│             (Public Facing)                             │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS (Port 443)
                       │
        ┌──────────────▼─────────────┐
        │  Railway Router             │
        │  (DNS & Load Balancer)      │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼─────────────┐
        │  Railway Private Network    │
        │  (Isolated, Secure)         │
        │                             │
        │  ┌──────────────────────┐   │
        │  │  Application         │   │
        │  │  Containers          │   │
        │  └─────────┬────────────┘   │
        │            │                │
        │  ┌─────────▼────────────┐   │
        │  │  PostgreSQL          │   │
        │  │  Redis               │   │
        │  │  Shared Storage      │   │
        │  └──────────────────────┘   │
        │                             │
        └─────────────────────────────┘
                       │
        ┌──────────────▼─────────────┐
        │  External Services          │
        │  (via secure connection)    │
        │                             │
        │  - MongoDB Atlas            │
        │  - Upstash Redis            │
        │  - GitHub                   │
        │  - Monitoring Tools         │
        └─────────────────────────────┘
```

## Database Connection Pooling

```
Application Container
    │
    ├─ Connection Pool (max 20 connections)
    │
    ├─ ┌─────────────────┐
    ├─ │ Connection 1    │ ──┐
    │  └─────────────────┘   │
    ├─ ┌─────────────────┐   │
    ├─ │ Connection 2    │   │
    │  └─────────────────┘   ├──── PostgreSQL
    ├─ ┌─────────────────┐   │
    ├─ │ ...             │   │
    │  └─────────────────┘   │
    └─ ┌─────────────────┐   │
       │ Connection N    │ ──┘
       └─────────────────┘

Idle Connections: Returned to pool after use
Max Lifetime: 30 minutes
Max Idle: 10 minutes
```

## Cache Architecture (Redis)

```
Application Requests
    │
    ├─ Cache Query (Get)
    │  ├─ Cache HIT  ──→ Return from Redis (fast)
    │  └─ Cache MISS ──→ Query Database → Store in Redis
    │
    └─ Cache Update (Set)
       └─ Update Redis on data changes
          (with TTL: 1h for session, 24h for config)

Redis Memory Layout:
┌──────────────────────────────┐
│ 2GB Total Capacity           │
├──────────────────────────────┤
│ Session Cache (30%)    600MB │
│ Query Cache (40%)      800MB │
│ Configuration (20%)    400MB │
│ Available (10%)        200MB │
└──────────────────────────────┘

Eviction Policy: allkeys-lru
(Remove least recently used when full)
```

## Backup & Recovery Architecture

```
Development
  │
  └─ Automated backups: Daily (7-day retention)
     └─ Stored on Railway managed storage
        └─ Manual restore from UI

Staging
  │
  └─ Automated backups: Daily (14-day retention)
     └─ Point-in-time recovery enabled
        └─ Manual restore from CLI

Production
  │
  ├─ Automated backups: Hourly (30-day retention)
  ├─ Point-in-time recovery: Enabled (7-day window)
  ├─ Cross-region replication: Enabled
  ├─ Manual backups: Before major deployments
  └─ Disaster recovery plan: Documented
     ├─ RTO: 1 hour
     ├─ RPO: 15 minutes
     └─ Annual DR drill: Required
```

## Cost Allocation Diagram

```
Monthly Budget: $70-120

Development ($8/month)
  ├─ PostgreSQL: $5 (1GB storage)
  ├─ Redis: $3 (128MB)
  └─ Application: $0 (free tier)

Staging ($23/month)
  ├─ PostgreSQL: $15 (5GB storage)
  ├─ Redis: $8 (512MB)
  └─ Application: $0 (free tier)

Production ($42+/month)
  ├─ PostgreSQL: $25 (20GB storage, HA)
  ├─ Redis: $12 (2GB)
  ├─ Application: $5+ (paid deployment)
  └─ Monitoring: $0-5 (optional)

MongoDB Atlas
  ├─ Free tier: $0/month (all environments)
  └─ Pro tier: $7+ (if upgraded)

Optional Services
  ├─ Upstash: $0-25/month (if used)
  └─ Monitoring (Sentry, etc.): $0-50/month
```

## Disaster Recovery Architecture

```
Primary Data Center (Railway)
    │
    ├─ Real-time Replication
    ├─ Point-in-time Backups
    └─ Cross-region Snapshots
         │
         ▼
Backup Storage (AWS S3 / GCS)
    │
    ├─ Automated daily snapshots
    ├─ 30-day retention (production)
    ├─ Version control enabled
    └─ Cross-region replication

Recovery Process:
1. Detect failure (monitoring alerts)
2. Activate recovery procedure (1-5 min)
3. Restore from backup (15-30 min)
4. Verify data integrity (5-10 min)
5. Notify users (immediate)
6. Post-incident review

RTO: Recovery Time Objective = 1 hour
RPO: Recovery Point Objective = 15 minutes
```

## Monitoring & Alerting Architecture

```
Application
    │
    ├─ Metrics Export
    │  └─ Prometheus format
    │
    ├─ Log Aggregation
    │  └─ CloudWatch / Datadog / ELK
    │
    └─ Error Tracking
       └─ Sentry integration
          │
          ▼
      ┌───────────────────────┐
      │ Monitoring Stack      │
      │                       │
      │ - Dashboards          │
      │ - Alerting Rules      │
      │ - Incident Response   │
      │ - Historical Analysis │
      └───────────────────────┘
          │
          ├─ Slack/Email Alerts
          ├─ PagerDuty (on-call)
          └─ Dashboard UI
```

## References

- [Railway Architecture](https://docs.railway.app)
- [PostgreSQL High Availability](https://www.postgresql.org/docs/current/warm-standby.html)
- [Redis Persistence](https://redis.io/topics/persistence)
- [Blue-Green Deployment Pattern](https://martinfowler.com/bliki/BlueGreenDeployment.html)
