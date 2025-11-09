# Blue-Green Deployment Strategy

## Overview

Blue-green deployment is a release technique that reduces downtime and risk by running two identical production environments. At any given time, only one of them receives live traffic from users.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       Load Balancer                              │
│                    (Railway Router/DNS)                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
    ┌────▼────┐                    ┌────▼────┐
    │  BLUE   │                    │ GREEN   │
    │ (Active)│                    │(Standby)│
    └────┬────┘                    └────┬────┘
         │                              │
    ┌────▼─────────────────────────────▼────┐
    │   Shared Services                      │
    │  - PostgreSQL Database                 │
    │  - Redis Cache                         │
    │  - MongoDB Atlas                       │
    │  - Upstash (if applicable)             │
    └────────────────────────────────────────┘
```

## Deployment Process

### Phase 1: Build and Deploy Green

```
1. New code pushed to main branch
2. GitHub triggers Railway webhook
3. Railway builds Docker image
4. Image deployed to GREEN environment
5. Secrets and environment variables injected
6. Application starts in GREEN
```

### Phase 2: Health Verification

```
1. Railway health check endpoint: GET /health
2. Verify database connectivity
3. Verify cache connectivity
4. Verify external services
5. Run smoke tests
6. Monitor logs for errors
```

### Phase 3: Traffic Switch

```
1. If all checks pass:
   - Update load balancer to route to GREEN
   - GREEN becomes new BLUE (active)
   - Previous BLUE becomes GREEN (standby)

2. If checks fail:
   - Abort deployment
   - Keep BLUE active
   - Debug and fix in GREEN
```

### Phase 4: Rollback Window

```
1. Maintain previous version in standby for 2 hours
2. Monitor metrics and error rates
3. If issues detected, switch traffic back
4. After 2 hours, decommission old version
```

## Implementation Details

### Railway Service Configuration

#### Development Environment

```yaml
Environment: development
Branch: develop
Deployment Strategy: Standard (immediate)
Auto-Deploy: Enabled
Instances: 1
Memory: 512MB
CPU: 0.5
Restart Policy: On failure
```

#### Staging Environment

```yaml
Environment: staging
Branch: staging
Deployment Strategy: Standard (immediate)
Auto-Deploy: Enabled
Instances: 2
Memory: 1GB
CPU: 1.0
Restart Policy: On failure
```

#### Production Environment

```yaml
Environment: production
Branch: main
Deployment Strategy: Blue-Green
Auto-Deploy: Enabled
Instances: 2 (per environment)
Memory: 2GB
CPU: 1.5
Restart Policy: On failure
Health Check Path: /health
Health Check Interval: 30s
Health Check Timeout: 5s
Rollback Window: 2 hours
```

### Health Check Configuration

```javascript
// Required endpoint: GET /health
// Returns: HTTP 200 for healthy, 503 for unhealthy

{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600,
  "checks": {
    "database": "healthy",      // Required
    "redis": "healthy",          // Required
    "mongodb": "healthy"         // Optional
  },
  "version": "1.2.3"
}
```

### Database Migrations

Blue-green deployments require careful handling of database migrations:

#### Forward-Compatible Migrations

1. **Column Addition (Safe):**
   - Add new columns with DEFAULT values
   - Add NULL constraints after transition

2. **Column Removal (Complex):**
   - Step 1: Deploy code ignoring the column (BLUE)
   - Step 2: Run removal migration
   - Step 3: Deploy updated code (GREEN)

3. **Column Renaming:**
   - Step 1: Add new column as copy
   - Step 2: Deploy code reading from both columns
   - Step 3: Remove old column

#### Migration Timing

```
1. BLUE is active with old schema
2. Deploy migration to add new column
3. Deploy GREEN with code supporting both schemas
4. Switch traffic to GREEN
5. Remove old column in next deployment
```

### Environment-Specific Behaviors

#### Development

- Deploy on every push to `develop`
- No health check required
- Immediate restart on failure
- No rollback window

#### Staging

- Deploy on every push to `staging`
- Validate health check
- Rollback on failure
- 1-hour rollback window
- Performance testing

#### Production

- Deploy on every push to `main`
- Strict health check validation
- Blue-green deployment strategy
- 2-hour rollback window
- Gradual traffic shift (optional)

## Manual Rollback Procedure

### Step 1: Identify Issue

Monitor production metrics:
- Error rate spike
- Response time increase
- Database connection failures
- Cache misses

### Step 2: Trigger Rollback

**Option A: Via Railway Dashboard**

1. Navigate to Production Environment
2. Click "Deployments" tab
3. Select previous successful deployment
4. Click "Rollback"

**Option B: Via Railway CLI**

```bash
railway rollback [deployment-id]
```

### Step 3: Verify Rollback

```bash
# Check current deployment
railway status

# Monitor logs
railway logs --follow

# Test endpoints
curl https://api.example.com/health
```

### Step 4: Investigate & Fix

```bash
# Review failed deployment logs
railway logs --deployment [failed-deployment-id]

# Check metrics during failure
railway metrics --time 1h

# Review code changes
git log -p [sha1]..HEAD
```

## Testing Blue-Green Locally

### Setup Local Environment

```bash
# Install Docker and Docker Compose
docker-compose up -d

# Database should be available
psql postgresql://user:password@localhost:5432/app
redis-cli -h localhost
```

### Simulate Blue-Green Switch

```bash
# Terminal 1: Start BLUE application
PORT=3000 NODE_ENV=production npm start

# Terminal 2: Test BLUE
curl http://localhost:3000/health
curl http://localhost:3000/api/status

# Terminal 3: Start GREEN application
PORT=3001 NODE_ENV=production npm start

# Terminal 4: Test GREEN
curl http://localhost:3001/health

# Update load balancer/proxy config to route to 3001 (GREEN)
# Then test traffic

# Simulate rollback by routing back to 3000
```

### Load Testing

```bash
# Install load testing tool
npm install -g autocannon

# Test with concurrent users
autocannon -c 100 -d 60 http://localhost:3000/api

# Monitor metrics during traffic switch
watch 'curl -s http://localhost:3000/health | jq'
```

## Monitoring & Alerting

### Key Metrics

1. **Request Latency:**
   - p50, p95, p99 response times
   - Alert if > 1s (p95)

2. **Error Rate:**
   - HTTP 5xx errors
   - Alert if > 1%

3. **Database Connections:**
   - Active connections
   - Connection pool utilization
   - Alert if > 80% utilization

4. **Cache Hit Rate:**
   - Redis command success rate
   - Alert if < 80%

### Alerting Rules

```yaml
Rules:
  - name: HighErrorRate
    condition: error_rate > 0.01
    duration: 5m
    action: Page on-call engineer

  - name: HighLatency
    condition: response_time_p95 > 1000ms
    duration: 5m
    action: Notify #alerts channel

  - name: HealthCheckFailure
    condition: health_check_status != 200
    duration: 1m
    action: Trigger incident

  - name: DatabaseConnectionPoolExhausted
    condition: db_connections > pool_max * 0.9
    duration: 2m
    action: Page on-call engineer

  - name: FailedDeployment
    condition: deployment_status == failed
    duration: 0
    action: Notify #deployments channel
```

## Best Practices

### Before Deployment

- [ ] All tests passing locally and in CI
- [ ] Code reviewed and approved
- [ ] Database migrations tested in staging
- [ ] Feature flags for risky changes
- [ ] Team notified of deployment time

### During Deployment

- [ ] Monitor logs in real-time
- [ ] Watch error rates and latency
- [ ] Have rollback procedure ready
- [ ] Team available for quick response
- [ ] Communication channel open

### After Deployment

- [ ] Verify metrics are healthy
- [ ] Check application functionality
- [ ] Monitor for 1 hour
- [ ] Document deployment notes
- [ ] Update runbooks if needed

## Troubleshooting

### Health Check Failing

**Symptom:** Deployment stuck, GREEN not receiving traffic

**Solutions:**
1. Check database is accessible from GREEN
2. Verify all environment variables are set
3. Review application startup logs
4. Increase health check timeout if migrations taking too long

### Partial Traffic Switch

**Symptom:** Some requests fail after switch

**Solutions:**
1. Immediate rollback to BLUE
2. Investigate connection state issues
3. Implement connection draining before traffic switch
4. Test with smaller traffic percentage first

### Database Migration Failures

**Symptom:** Deployment succeeds but requests fail

**Solutions:**
1. Use zero-downtime migration pattern
2. Deploy code changes before schema changes
3. Test migrations in staging first
4. Have rollback script prepared

### Cascading Failures

**Symptom:** One service down causes failures in others

**Solutions:**
1. Implement circuit breakers
2. Add graceful degradation
3. Separate critical from non-critical services
4. Test failure scenarios before production

## Advanced Strategies

### Canary Deployments

Route small percentage of traffic to GREEN before full switch:

```yaml
Traffic Split:
  GREEN: 5%  (minute 1)
  BLUE: 95%
  ---
  GREEN: 20% (minute 5)
  BLUE: 80%
  ---
  GREEN: 50% (minute 10)
  BLUE: 50%
  ---
  GREEN: 100% (minute 15)
  BLUE: 0%
```

### Shadow Traffic

Send traffic to GREEN but don't use responses:

```
Clients → Load Balancer
           ├→ BLUE (responses returned)
           └→ GREEN (responses discarded, metrics collected)
```

### Feature Flags

Enable/disable features per environment:

```javascript
if (featureFlag.isEnabled('new-checkout')) {
  // Use new checkout flow
} else {
  // Use legacy checkout flow
}
```

## References

- [Martin Fowler - Blue Green Deployment](https://martinfowler.com/bliki/BlueGreenDeployment.html)
- [Railway Deployments Docs](https://docs.railway.app/deploy/deployments)
- [Kubernetes Rolling Deployments](https://kubernetes.io/docs/tutorials/kubernetes-basics/update/update-intro/)
