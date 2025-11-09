# Credential Rotation Guide

## Overview

Credential rotation is a security best practice that minimizes the impact of a compromised secret by regularly replacing credentials. This guide outlines procedures for rotating different types of credentials across all Railway environments.

## Rotation Schedule

### Critical Secrets

- **JWT Secrets:** Every 180 days or immediately on suspected compromise
- **API Keys:** Every 180 days or immediately on suspected compromise
- **Encryption Keys:** Every 90 days or immediately on suspected compromise

### Database Credentials

- **Production:** Every 90 days during low-traffic window (off-peak hours)
- **Staging:** Every 180 days during maintenance window
- **Development:** Every 6 months

### Third-Party Service Credentials

- **MongoDB Atlas:** Every 90 days
- **Upstash:** Every 90 days
- **External APIs:** Follow third-party recommendations

## General Rotation Procedure

### Step 1: Generate New Credential

```bash
# Log in to Railway
railway login

# Navigate to project
railway switch

# Access environment
railway env list
railway env select production
```

### Step 2: Create Secret Version

```bash
# Create new version of secret with _v2 suffix
railway env set JWT_SECRET_V2 "$(openssl rand -base64 32)"

# Keep old secret temporarily for graceful transition
# This allows both old and new secrets to be valid
```

### Step 3: Deploy Code to Accept Both

```bash
# Update application code to accept both versions
# Example in Node.js:

const verifyToken = (token) => {
  try {
    // Try with new secret first
    return jwt.verify(token, process.env.JWT_SECRET_V2);
  } catch (err) {
    // Fallback to old secret for grace period
    return jwt.verify(token, process.env.JWT_SECRET);
  }
};
```

### Step 4: Deploy Updated Application

```bash
# Commit code changes
git add .
git commit -m "feat: support dual JWT secrets for rotation"
git push origin main

# Railway auto-deploys
# Monitor deployment
railway logs --follow
```

### Step 5: Update Primary Secret

```bash
# After successful deployment and monitoring (24 hours)
railway env set JWT_SECRET "$(railway env get JWT_SECRET_V2)"

# Remove old secret version after verification
railway env delete JWT_SECRET_V2
```

### Step 6: Verify and Clean Up

```bash
# Test authentication with new secret
curl -H "Authorization: Bearer $TOKEN" https://api.example.com/health

# Monitor for 1 hour
watch -n 10 'railway logs | tail -20'

# Document rotation completion
echo "JWT_SECRET rotated at $(date)" >> ROTATION_LOG.txt
```

## Database Credential Rotation

### PostgreSQL Rotation

#### Step 1: Create New Database User

```bash
# Connect to production database
psql $DATABASE_URL

# Inside PostgreSQL shell
CREATE ROLE prod_user_v2 WITH LOGIN PASSWORD 'NEW_SECURE_PASSWORD';
GRANT CONNECT ON DATABASE mvp_production TO prod_user_v2;
GRANT USAGE ON SCHEMA public TO prod_user_v2;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO prod_user_v2;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO prod_user_v2;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO prod_user_v2;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO prod_user_v2;
```

#### Step 2: Deploy with New Connection String

```bash
# Set new DATABASE_URL in Railway
NEW_URL="postgresql://prod_user_v2:NEW_PASSWORD@db.railway.app:5432/mvp_production?sslmode=require"
railway env set DATABASE_URL_V2 "$NEW_URL"

# Deploy code supporting both connection strings
railway env set DATABASE_URL_V2 "$NEW_URL"
```

#### Step 3: Update and Test

```bash
# Update application to use new connection string
git add .
git commit -m "chore: update database connection for user rotation"
git push origin main

# Monitor new connections
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity WHERE usename = 'prod_user_v2';"
```

#### Step 4: Switch to New User

```bash
# After successful operation for 24 hours
railway env set DATABASE_URL "$NEW_URL"
railway env delete DATABASE_URL_V2

# Drop old user
psql $DATABASE_URL -c "DROP ROLE prod_user;"
```

### MongoDB Atlas Rotation

#### Step 1: Create New Database User in Atlas

1. Go to MongoDB Atlas dashboard
2. Select Project → Database Access
3. Click "Add New User"
4. Create user with strong password
5. Grant appropriate role (Database Owner or Custom)
6. Generate new connection string

#### Step 2: Add to Railway Secrets

```bash
NEW_MONGODB_URI="mongodb+srv://NEW_USER:NEW_PASSWORD@cluster.mongodb.net/mvp_production?retryWrites=true&w=majority"
railway env set MONGODB_URI_V2 "$NEW_MONGODB_URI"
```

#### Step 3: Deploy and Verify

```bash
# Deploy code supporting both connection strings
git add .
git commit -m "chore: add dual MongoDB credentials for rotation"
git push origin main

# Verify connections in MongoDB Atlas
# Navigate to Metrics → Network to see connection activity
```

#### Step 4: Complete Rotation

```bash
# After 24-hour successful operation
railway env set MONGODB_URI "$NEW_MONGODB_URI"
railway env delete MONGODB_URI_V2

# Delete old user in MongoDB Atlas
# Atlas Dashboard → Database Access → Delete old user
```

## API Key Rotation

### Third-Party API Keys

#### Step 1: Generate New Key

```bash
# Generate new key in service (example: SendGrid, Stripe, etc.)
# Usually available in service dashboard Settings → API Keys

# Example for SendGrid:
# 1. Login to sendgrid.com
# 2. Go to Settings → API Keys
# 3. Click Create API Key
# 4. Name: API_KEY_v2
# 5. Copy the generated key
```

#### Step 2: Deploy with Dual Keys

```bash
# Add new key to Railway
railway env set SENDGRID_API_KEY_V2 "NEW_KEY_VALUE"

# Update application code
# In Node.js:
const apiKey = process.env.SENDGRID_API_KEY_V2 || process.env.SENDGRID_API_KEY;

# Deploy
git add .
git commit -m "chore: support dual API keys for SendGrid rotation"
git push origin main
```

#### Step 3: Monitor Success

```bash
# Check API usage in service dashboard
# Verify new key is being used successfully

# Wait 24 hours for all connections to use new key
sleep 86400
```

#### Step 4: Disable Old Key

```bash
# Remove old key from Railroad
railway env delete SENDGRID_API_KEY

# Disable old key in service dashboard
# Example SendGrid: Settings → API Keys → Disable old key
```

## JWT Secret Rotation

### Create New Signing Key

```bash
# Generate new JWT secret
openssl rand -base64 32
# or using Node.js
require('crypto').randomBytes(32).toString('base64')

# Result example:
# abc123def456ghi789jkl012mno345pqr678stu901vwx234yz...
```

### Implementation Strategy

```javascript
// Before rotation: sign and verify with JWT_SECRET
const token = jwt.sign(payload, process.env.JWT_SECRET);
jwt.verify(token, process.env.JWT_SECRET);

// During rotation: sign with new, verify with both
const token = jwt.sign(payload, process.env.JWT_SECRET_V2);

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET_V2);
  } catch (err) {
    // Accept tokens signed with old key for 24 hours
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err2) {
      throw new Error('Invalid token');
    }
  }
};

// After rotation: only verify with JWT_SECRET_V2
```

### Implementation Steps

1. Deploy code that generates tokens with new secret but verifies with both
2. Wait 24-48 hours for old tokens to expire naturally
3. Remove old secret from environment
4. New tokens use new secret exclusively

## Encryption Key Rotation

### Handling Encrypted Data

```javascript
// During rotation: decrypt with old, encrypt with new
class EncryptionService {
  constructor() {
    this.currentKey = process.env.ENCRYPTION_KEY_V2;
    this.oldKey = process.env.ENCRYPTION_KEY;
  }

  decrypt(encryptedData) {
    try {
      return this.decryptWithKey(encryptedData, this.currentKey);
    } catch (err) {
      return this.decryptWithKey(encryptedData, this.oldKey);
    }
  }

  encrypt(plaintext) {
    return this.encryptWithKey(plaintext, this.currentKey);
  }

  // Private methods...
}
```

### Data Re-encryption (Optional)

If you want to re-encrypt all stored data with the new key:

```javascript
// Migration script
async function reencryptData() {
  const items = await db.query('SELECT id, encrypted_field FROM items');
  
  for (const item of items) {
    const plaintext = encryptionService.decrypt(item.encrypted_field);
    const newEncrypted = encryptionService.encrypt(plaintext);
    
    await db.query(
      'UPDATE items SET encrypted_field = $1 WHERE id = $2',
      [newEncrypted, item.id]
    );
  }
}

// Run during low-traffic window
```

## Automation & Best Practices

### Rotation Checklist

Create a checklist for each rotation:

```markdown
## Credential Rotation Checklist - [DATE]

### Pre-Rotation
- [ ] Backup current credentials
- [ ] Notify team of rotation window
- [ ] Prepare rollback plan
- [ ] Review dependent services

### Rotation
- [ ] Generate new credential
- [ ] Add to Railway secrets with _v2 suffix
- [ ] Deploy code supporting dual credentials
- [ ] Test with new credential
- [ ] Monitor for 24 hours
- [ ] Update primary secret
- [ ] Deploy final code
- [ ] Revoke old credential

### Post-Rotation
- [ ] Verify no old credential usage
- [ ] Document in rotation log
- [ ] Update team on completion
- [ ] Schedule next rotation date

### Rollback (if needed)
- [ ] Revert environment variable
- [ ] Redeploy application
- [ ] Monitor for recovery
- [ ] Investigate failure
```

### Rotation Calendar

```bash
# Create rotation reminders
# Add to team calendar for:
# - JWT_SECRET: 180-day intervals
# - DB_PASSWORD: 90-day intervals
# - API_KEYS: 90-day intervals
# - ENCRYPTION_KEY: 90-day intervals
```

### Automated Notifications

Set up notifications for upcoming rotations:

```yaml
# GitHub Actions workflow for rotation reminders
name: Credential Rotation Reminder
on:
  schedule:
    - cron: '0 9 1 * *'  # First day of month at 9 AM

jobs:
  reminder:
    runs-on: ubuntu-latest
    steps:
      - name: Post rotation reminder
        run: |
          # Calculate next rotation dates
          # Send notification to team Slack channel
```

## Emergency Credential Revocation

If a credential is compromised:

### Immediate Actions (0-5 minutes)

1. **Revoke the credential immediately**
   ```bash
   railway env delete COMPROMISED_SECRET
   railway env set REVOKED_AT "$(date)"
   ```

2. **Deploy new code without the old credential**
   ```bash
   git add .
   git commit -m "SECURITY: revoke compromised credential"
   git push origin main --force-with-lease
   ```

3. **Notify security team**
   - Create incident ticket
   - Alert on-call engineer
   - Prepare incident report

### Follow-up Actions (5-60 minutes)

1. Review logs for misuse:
   ```bash
   railway logs --since "1h ago" | grep -i auth
   ```

2. Generate new credential with additional security:
   - Stronger password/key
   - Additional validation
   - Usage tracking

3. Deploy with new credential:
   ```bash
   railway env set REPLACEMENT_SECRET "$(openssl rand -base64 32)"
   ```

## Monitoring & Auditing

### Track Rotation Events

```javascript
// Log all credential usage
logger.info('Credential access', {
  credentialName: 'DATABASE_PASSWORD',
  environment: process.env.NODE_ENV,
  timestamp: new Date().toISOString(),
  service: 'database',
});
```

### Audit Trail

Maintain a log of all rotations:

```
DATE          CREDENTIAL          REASON          STATUS
2024-01-15    JWT_SECRET          Scheduled       Completed
2024-01-22    DB_PASSWORD         Scheduled       Completed
2024-02-01    API_KEY_SENDGRID    Compromised     Completed
```

## References

- [NIST SP 800-63B - Password Requirements](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [OWASP Secret Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Railway Secret Management Docs](https://docs.railway.app/develop/variables)
