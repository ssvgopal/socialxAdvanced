# Health Check Implementation Guide

## Overview

This guide provides reference implementations for health check endpoints required for zero-downtime blue-green deployments.

## Express.js Example

```typescript
import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import redis from 'redis';

const app = express();

const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
});

interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  checks: {
    database: 'healthy' | 'unhealthy';
    redis: 'healthy' | 'unhealthy';
    mongodb?: 'healthy' | 'unhealthy';
  };
  version?: string;
}

app.get('/health', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const checks = {
    database: 'unhealthy' as const,
    redis: 'unhealthy' as const,
  };
  let overallStatus: 'ok' | 'degraded' | 'error' = 'ok';

  // Check PostgreSQL
  try {
    const client = await pgPool.connect();
    await client.query('SELECT NOW()');
    client.release();
    checks.database = 'healthy';
  } catch (error) {
    console.error('Database health check failed:', error);
    checks.database = 'unhealthy';
    overallStatus = 'degraded';
  }

  // Check Redis
  try {
    await redisClient.ping();
    checks.redis = 'healthy';
  } catch (error) {
    console.error('Redis health check failed:', error);
    checks.redis = 'unhealthy';
    overallStatus = 'degraded';
  }

  // Check MongoDB (if applicable)
  if (process.env.MONGODB_URI) {
    try {
      // Implement MongoDB connection check
      checks.mongodb = 'healthy';
    } catch (error) {
      console.error('MongoDB health check failed:', error);
      checks.mongodb = 'unhealthy';
      overallStatus = 'degraded';
    }
  }

  // If critical services are down, return error
  if (checks.database === 'unhealthy') {
    overallStatus = 'error';
  }

  const response: HealthCheckResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
    version: process.env.APP_VERSION || '1.0.0',
  };

  const statusCode = overallStatus === 'ok' ? 200 : 503;
  res.status(statusCode).json(response);
});

// Liveness probe (container is running)
app.get('/alive', (req: Request, res: Response) => {
  res.status(200).json({ status: 'alive' });
});

// Readiness probe (ready to accept traffic)
app.get('/ready', async (req: Request, res: Response) => {
  try {
    const client = await pgPool.connect();
    await client.query('SELECT 1');
    client.release();
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready' });
  }
});

export default app;
```

## FastAPI (Python) Example

```python
from fastapi import FastAPI, Response
from fastapi.responses import JSONResponse
from datetime import datetime
from sqlalchemy import text
from sqlalchemy.pool import QueuePool
import redis
import time
import os

app = FastAPI()

# Database connection pool
from sqlalchemy import create_engine
engine = create_engine(
    os.getenv("DATABASE_URL"),
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_recycle=3600,
)

# Redis client
redis_client = redis.from_url(os.getenv("REDIS_URL"))

@app.get("/health")
async def health_check() -> JSONResponse:
    """Comprehensive health check endpoint"""
    checks = {
        "database": "unhealthy",
        "redis": "unhealthy",
    }
    overall_status = "ok"
    
    # Check PostgreSQL
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT NOW()"))
            checks["database"] = "healthy"
    except Exception as e:
        print(f"Database health check failed: {e}")
        checks["database"] = "unhealthy"
        overall_status = "degraded"
    
    # Check Redis
    try:
        redis_client.ping()
        checks["redis"] = "healthy"
    except Exception as e:
        print(f"Redis health check failed: {e}")
        checks["redis"] = "unhealthy"
        overall_status = "degraded"
    
    # If critical services are down
    if checks["database"] == "unhealthy":
        overall_status = "error"
    
    response_data = {
        "status": overall_status,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "checks": checks,
        "version": os.getenv("APP_VERSION", "1.0.0"),
    }
    
    status_code = 200 if overall_status == "ok" else 503
    return JSONResponse(content=response_data, status_code=status_code)


@app.get("/alive")
async def alive() -> JSONResponse:
    """Liveness probe"""
    return JSONResponse({"status": "alive"})


@app.get("/ready")
async def ready() -> JSONResponse:
    """Readiness probe"""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return JSONResponse({"status": "ready"})
    except Exception:
        return JSONResponse({"status": "not ready"}, status_code=503)
```

## Go Example

```go
package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
)

type HealthCheckResponse struct {
	Status    string                 `json:"status"`
	Timestamp string                 `json:"timestamp"`
	Uptime    float64                `json:"uptime"`
	Checks    map[string]string      `json:"checks"`
	Version   string                 `json:"version"`
}

var (
	db    *sql.DB
	rdb   *redis.Client
	start time.Time
)

func init() {
	start = time.Now()
}

func healthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	checks := map[string]string{
		"database": "unhealthy",
		"redis":    "unhealthy",
	}
	overallStatus := "ok"

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Check PostgreSQL
	if err := db.PingContext(ctx); err != nil {
		log.Printf("Database health check failed: %v", err)
		checks["database"] = "unhealthy"
		overallStatus = "degraded"
	} else {
		checks["database"] = "healthy"
	}

	// Check Redis
	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Printf("Redis health check failed: %v", err)
		checks["redis"] = "unhealthy"
		overallStatus = "degraded"
	} else {
		checks["redis"] = "healthy"
	}

	// If critical services down
	if checks["database"] == "unhealthy" {
		overallStatus = "error"
	}

	response := HealthCheckResponse{
		Status:    overallStatus,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Uptime:    time.Since(start).Seconds(),
		Checks:    checks,
		Version:   os.Getenv("APP_VERSION"),
	}

	statusCode := http.StatusOK
	if overallStatus != "ok" {
		statusCode = http.StatusServiceUnavailable
	}

	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(response)
}

func alive(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "alive"})
}

func ready(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(map[string]string{"status": "not ready"})
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ready"})
}

func main() {
	// Database setup
	var err error
	db, err = sql.Open("postgres", os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// Redis setup
	rdb = redis.NewClient(&redis.Options{
		Addr: os.Getenv("REDIS_URL"),
	})
	defer rdb.Close()

	http.HandleFunc("/health", healthCheck)
	http.HandleFunc("/alive", alive)
	http.HandleFunc("/ready", ready)

	log.Printf("Health check server listening on :3000")
	log.Fatal(http.ListenAndServe(":3000", nil))
}
```

## Kubernetes/Docker Health Check Configuration

If using Docker/Kubernetes, configure health checks as follows:

### Docker Compose Example

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/app
      - REDIS_URL=redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 40s

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: app
      POSTGRES_PASSWORD: password
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
```

### Kubernetes Example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  selector:
    matchLabels:
      app: app
  template:
    metadata:
      labels:
        app: app
    spec:
      containers:
      - name: app
        image: app:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: redis-url
        livenessProbe:
          httpGet:
            path: /alive
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 5
          failureThreshold: 2
        startupProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 0
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 30
```

## Testing Health Checks Locally

```bash
# Start your application
npm start

# In another terminal, test the endpoints
curl -v http://localhost:3000/health
curl -v http://localhost:3000/alive
curl -v http://localhost:3000/ready

# Expected 200 response with status: "ok"
# Expected 503 response if any critical check fails
```

## Railway Configuration

In Railway dashboard, configure the health check as follows:

1. Navigate to **Project Settings** > **Service** > **Health Check**
2. Set **Path:** `/health`
3. Set **Port:** 3000 (or your application port)
4. Set **Timeout:** 5000ms
5. Set **Interval:** 30000ms (30 seconds)
6. Set **Healthy Threshold:** 2 consecutive successes
7. Set **Unhealthy Threshold:** 3 consecutive failures

## Monitoring Health Check Failures

Watch Railway logs for health check failures:

```bash
# Monitor in real-time
railway logs --follow

# Filter for health check errors
railway logs | grep -i health
```

## Best Practices

1. **Keep it simple:** Health checks should complete quickly (< 5 seconds)
2. **Check dependencies:** Verify all critical dependencies (database, cache, external services)
3. **Return appropriate status codes:** 200 for healthy, 503 for degraded/unhealthy
4. **Include useful information:** Return version, uptime, and individual checks
5. **Avoid heavy operations:** Don't perform long-running tasks in health checks
6. **Implement graceful degradation:** Services can be partially healthy
7. **Monitor health endpoint:** Track health check patterns to detect issues early
