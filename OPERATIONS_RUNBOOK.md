# Operations Runbook

## Quick Reference

### Common Commands

```bash
# Access Railway CLI
railway login
railway switch

# View logs
railway logs --follow
railway logs --tail 100

# Environment management
railway env list
railway env get DATABASE_URL
railway env set VAR_NAME value
railway env delete VAR_NAME

# Execute commands in container
railway run npm run migrate
railway run npm run seed

# View services
railway status
railway services list

# Switch environments
railway env select development
railway env select staging
railway env select production
```

## Daily Operations

### 1. Monitor Health Status

```bash
# Check all services health
railway logs --follow

# Specific service health
curl https://api.example.com/health
curl https://api.example.com/alive
curl https://api.example.com/ready
```

### 2. Check Resource Usage

```bash
# In Railway Dashboard:
# 1. Select environment
# 2. Go to "Metrics"
# 3. Monitor:
#    - CPU usage
#    - Memory usage
#    - Network I/O
#    - Disk I/O
#    - Connection pool

# Database size
railway run "psql \$DATABASE_URL -c \"SELECT pg_size_pretty(pg_database_size('postgres'));\"" 

# Cache usage
railway run "redis-cli --url \$REDIS_URL INFO memory"
```

### 3. Verify Backups

```bash
# PostgreSQL backups
railway run "pg_dump \$DATABASE_URL | head -c 1000"

# Redis snapshots
railway run "redis-cli --url \$REDIS_URL LASTSAVE"

# Check backup timestamps
railway logs | grep -i backup
```

## Common Procedures

### Database Maintenance

#### 1. Connect to Database

```bash
# Development
railway env select development
railway run psql

# Staging
railway env select staging
railway run psql

# Production
railway env select production
railway run psql
```

#### 2. Run Migrations

```bash
# Automatic with deployment
# Or manual run:

railway run npm run migrate
railway run npm run migrate:latest
railway run npm run migrate:rollback
```

#### 3. Database Cleanup

```bash
# Remove old data
railway run psql << EOF
DELETE FROM events WHERE created_at < NOW() - INTERVAL '30 days';
DELETE FROM logs WHERE created_at < NOW() - INTERVAL '7 days';
VACUUM ANALYZE;
EOF

# Analyze query performance
railway run psql << EOF
ANALYZE;
EXPLAIN ANALYZE SELECT ...
EOF
```

### Cache Management

#### 1. Flush Cache

```bash
# All data
railway run redis-cli FLUSHALL

# Development only
railway env select development
railway run redis-cli FLUSHDB

# Production cache namespace
railway run redis-cli KEYS "production:*" | xargs redis-cli DEL
```

#### 2. Monitor Cache

```bash
# Connection stats
railway run redis-cli INFO clients

# Memory stats
railway run redis-cli INFO memory

# Key stats
railway run redis-cli DBSIZE

# Find large keys
railway run redis-cli --bigkeys
```

#### 3. Warm Cache

```bash
# Warm critical data into cache
railway run npm run cache:warm

# Check cache coverage
railway run "node scripts/cache-stats.js"
```

### Deployment Operations

#### 1. Manual Deployment

```bash
# Trigger deployment
git push origin main

# Or manually via Railway Dashboard:
# 1. Select environment
# 2. Click "Deploy"
# 3. Select commit
# 4. Click "Deploy"
```

#### 2. View Deployment History

```bash
# In Railway Dashboard:
# 1. Select environment
# 2. Go to "Deployments"
# 3. View all deployments with status

# Via CLI:
railway deployments list
```

#### 3. Rollback Deployment

```bash
# Via CLI:
railway rollback [deployment-id]

# Or via Dashboard:
# 1. Select environment
# 2. Go to "Deployments"
# 3. Find previous successful deployment
# 4. Click "Rollback"
```

### Environment Variable Management

#### 1. View All Variables

```bash
railway env list
```

#### 2. Add New Variable

```bash
railway env set NEW_VAR "value"
```

#### 3. Update Variable

```bash
railway env set EXISTING_VAR "new_value"

# Trigger redeployment
git push origin main
```

#### 4. Delete Variable

```bash
railway env delete OLD_VAR

# Trigger redeployment
git push origin main
```

#### 5. Export Variables

```bash
# Export to file
railway env export > .env.backup

# Import from file
railway env import < .env.backup
```

### Credential Management

#### 1. Rotate Database Credentials

```bash
# Step 1: Generate new password
openssl rand -base64 16

# Step 2: Update user password in database
railway run psql << EOF
ALTER ROLE production_user WITH PASSWORD 'new_password';
EOF

# Step 3: Update environment variable
railway env set DATABASE_URL "postgresql://user:new_password@host:5432/db"

# Step 4: Deploy and verify
git push origin main
railway logs --follow

# Step 5: After successful deployment, revoke old user
railway run psql << EOF
DROP ROLE old_production_user;
EOF
```

#### 2. Rotate API Secrets

```bash
# Step 1: Generate new secret
new_secret=$(openssl rand -base64 32)

# Step 2: Create dual-secret support in code
# Update application to accept both OLD_SECRET and NEW_SECRET

# Step 3: Deploy new code
git add .
git commit -m "chore: support dual API secrets for rotation"
git push origin main

# Step 4: Update primary secret in Railway
railway env set API_KEY_SECRET "$new_secret"

# Step 5: Deploy again
git push origin main

# Step 6: Monitor for 24 hours
railway logs --follow

# Step 7: Remove old secret support from code
# Update application to accept only NEW_SECRET

# Step 8: Final deployment
git add .
git commit -m "chore: remove old API secret support"
git push origin main
```

## Troubleshooting Procedures

### Application Won't Start

```bash
# Step 1: Check logs
railway logs --tail 50 --follow

# Step 2: Verify environment variables
railway env list

# Step 3: Test critical connections
railway run "psql \$DATABASE_URL -c 'SELECT 1;'"
railway run "redis-cli --url \$REDIS_URL PING"
railway run "node -e \"require('mongodb').connect(process.env.MONGODB_URI);\""

# Step 4: Check resource constraints
# In Dashboard: Deployments → Select failed deployment → Check logs

# Step 5: Increase debug output
railway env set DEBUG=true
git push origin main
railway logs --follow

# Step 6: Rollback if needed
railway rollback [last-good-deployment-id]
```

### Database Connection Failing

```bash
# Step 1: Verify connection string format
railway env get DATABASE_URL

# Step 2: Test connection directly
railway run psql "$DATABASE_URL" -c "SELECT 1;"

# Step 3: Check firewall rules
# In Railway Dashboard:
# 1. Select PostgreSQL service
# 2. Check "Connect" details
# 3. Verify IP whitelist (if enabled)

# Step 4: Verify database is running
# In Railway Dashboard:
# 1. Select PostgreSQL service
# 2. Check status: Should be "Running"

# Step 5: Check user permissions
railway run psql "$DATABASE_URL" -c "\du"

# Step 6: Monitor connections
railway run psql "$DATABASE_URL" -c "SELECT * FROM pg_stat_activity;"
```

### High Memory Usage

```bash
# Step 1: Monitor current usage
railway run redis-cli INFO memory
railway run psql -c "SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# Step 2: Find memory leaks in app
railway run node --inspect=0.0.0.0:9229 app.js
# Connect remote debugger and take heap snapshot

# Step 3: Check cache hit rate
# If low, cache is ineffective

# Step 4: Identify large queries
railway run psql -c "SELECT query, calls, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC;"

# Step 5: Clear unused cache
railway run redis-cli FLUSHDB

# Step 6: Upgrade resources if needed
# In Dashboard: Service settings → Increase memory allocation
```

### High Error Rate

```bash
# Step 1: Check error logs
railway logs --follow | grep -i error

# Step 2: Check Sentry integration
# Navigate to: https://sentry.io
# Review errors for patterns

# Step 3: Check database status
railway run psql -c "SELECT 1;"

# Step 4: Check cache status
railway run redis-cli PING

# Step 5: Monitor external services
curl -I https://external-api.example.com

# Step 6: Review recent deployments
# In Dashboard: Deployments
# Check if error started after specific deployment

# Step 7: Check rate limiting
railway logs | grep -i "rate limit"

# Step 8: Rollback if needed
railway rollback [previous-good-deployment]
```

### Slow Response Times

```bash
# Step 1: Check server latency
railway logs | grep "response_time"

# Step 2: Identify slow queries
railway run psql << EOF
SELECT query, calls, mean_exec_time 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
EOF

# Step 3: Check cache hit rate
redis_info=$(railway run redis-cli INFO stats)
echo "$redis_info" | grep "hits\|misses"

# Step 4: Check CPU usage
# In Dashboard: Metrics → CPU
# Should be < 70%

# Step 5: Add indexes for slow queries
railway run psql << EOF
EXPLAIN ANALYZE SELECT ...;
CREATE INDEX idx_name ON table(column);
EOF

# Step 6: Increase cache TTL
# In application config

# Step 7: Scale up resources
# In Dashboard: Service → Edit → Increase CPU/Memory
```

### Blue-Green Deployment Issues

```bash
# Step 1: Check deployment status
# In Dashboard: Deployments
# Verify GREEN deployment status

# Step 2: Check health check
curl -v https://api.example.com/health

# Step 3: View GREEN logs
railway logs | grep -i green
railway logs | grep -i health

# Step 4: Check database migrations
railway run npm run migrate:status

# Step 5: Manual traffic switch
# In Dashboard: 
# 1. Select Production environment
# 2. Go to "Deployments"
# 3. Find BLUE deployment
# 4. Click "Set Active"

# Step 6: Immediate rollback
# In Dashboard:
# 1. Select previous BLUE deployment
# 2. Click "Rollback"

# Step 7: Debug why GREEN failed
railway logs --deployment [green-deployment-id] | tail -100
```

## Incident Response

### Severity Levels

**P1 (Critical):** Production down, customers affected
**P2 (High):** Degraded service, some features unavailable
**P3 (Medium):** Non-critical service affected
**P4 (Low):** No customer impact, internal issue

### P1 Response Checklist

```
⏱️  Start timer (target: < 15 min to mitigation)

1. [ ] Acknowledge incident
2. [ ] Create incident ticket
3. [ ] Page on-call engineer
4. [ ] Notify stakeholders (Slack #incidents)
5. [ ] Identify root cause (5 min)
6. [ ] Begin mitigation (5 min)
   - [ ] Rollback deployment
   - [ ] Scale up resources
   - [ ] Route traffic away
7. [ ] Implement fix (varies)
8. [ ] Deploy fix (5 min)
9. [ ] Verify recovery (5 min)
10. [ ] Document incident
11. [ ] Schedule post-mortem (48 hours)
```

### Rollback in Emergency

```bash
# Fastest possible rollback:

# Option 1: One-line rollback
railway rollback $(railway deployments list | grep -B1 "Successfully" | head -3 | tail -1)

# Option 2: Manual switch
# In Railway Dashboard:
# 1. Click "Deployments" tab
# 2. Find last known good deployment
# 3. Click "Rollback"
# 4. Confirm
# 5. Wait for traffic switch

# Verification:
curl https://api.example.com/health
railway logs --follow
```

## Monitoring & Metrics

### Key Metrics to Watch

```
Application Metrics:
  - Requests per second (RPS)
  - Error rate (% of requests returning 5xx)
  - Response latency (p50, p95, p99)
  - Active connections

Database Metrics:
  - Connection pool utilization (%)
  - Slow query count
  - Index hit ratio (%)
  - Disk usage (GB)

Cache Metrics:
  - Cache hit rate (%)
  - Connection count
  - Memory usage (MB)
  - Eviction rate

Infrastructure Metrics:
  - CPU usage (%)
  - Memory usage (%)
  - Disk I/O (MB/s)
  - Network I/O (MB/s)
```

### Set Up Alerts

```yaml
# Error Rate Alert
Condition: error_rate > 1%
Duration: 5 minutes
Action: Page on-call

# Latency Alert
Condition: p95_latency > 1000ms
Duration: 5 minutes
Action: Notify #alerts

# Database Alert
Condition: db_connections > max * 0.9
Duration: 2 minutes
Action: Page on-call

# Cache Alert
Condition: redis_memory > 1.8GB
Duration: 5 minutes
Action: Notify #alerts

# Deployment Alert
Condition: deployment fails
Duration: 0 minutes
Action: Notify #deployments
```

## References

- [Railway CLI Reference](https://docs.railway.app/cli/command-reference)
- [PostgreSQL Administration](https://www.postgresql.org/docs/current/admin.html)
- [Redis Administration](https://redis.io/topics/admin)
- [Incident Management Best Practices](https://www.pagerduty.com/blog/incident-response/)
