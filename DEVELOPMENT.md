# Development Guide

This guide covers the development workflow and best practices for the SocialX Advanced monorepo.

## Development Workflow

### 1. Initial Setup

```bash
# Clone the repository
git clone https://github.com/ssvgopal/socialxAdvanced.git
cd socialxAdvanced

# Run the setup script
./scripts/setup.sh
```

### 2. Daily Development

```bash
# Start infrastructure services
npm run docker:up

# Start all applications in development mode
npm run dev

# Or start individual services
nx serve frontend
nx serve backend
```

### 3. Testing

```bash
# Run all tests
npm run test

# Run tests with coverage
nx test frontend --coverage

# Run tests in watch mode
nx test backend --watch
```

### 4. Building

```bash
# Build all applications
npm run build

# Build specific application
nx build frontend
nx build backend
```

## Architecture Overview

### Monorepo Structure

```
socialx-advanced/
├── apps/                    # Applications
│   ├── frontend/           # Next.js frontend
│   └── backend/            # Node.js backend
├── packages/               # Shared libraries
│   └── shared/             # Shared types and utilities
├── services/               # Microservices
│   ├── mcp/               # Model Context Protocol services
│   └── agents/            # Autonomous agents
└── scripts/               # Utility scripts
```

### Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (primary), MongoDB (documents), Redis (cache)
- **Infrastructure**: Docker, Docker Compose, Railway
- **Development**: Nx, ESLint, Prettier, Husky

## Environment Variables

### Required Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
POSTGRES_PASSWORD=your_secure_password
MONGO_ROOT_PASSWORD=your_secure_password
REDIS_PASSWORD=your_secure_password

# Security
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_32_character_key

# Application
NODE_ENV=development
FRONTEND_PORT=3000
BACKEND_PORT=4000
```

### Optional Variables

```bash
# External Services
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Feature Flags
ENABLE_AI_FEATURES=false
ENABLE_ANALYTICS=false

# Monitoring
SENTRY_DSN=
LOG_LEVEL=info
```

## Database Schema

### PostgreSQL Tables

- `users` - User accounts and profiles
- `posts` - Social media posts
- `comments` - Post comments
- `likes` - Post likes

### MongoDB Collections

- User activity logs
- Analytics data
- Cache data

### Redis Usage

- Session storage
- API response caching
- Real-time data

## API Design

### RESTful Endpoints

```
GET    /api/health          - Health check
POST   /api/auth/login      - User authentication
GET    /api/users/profile   - User profile
GET    /api/posts           - Post feed
POST   /api/posts           - Create post
```

### Response Format

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

## Code Standards

### TypeScript

- Use strict mode
- Prefer interfaces over types for object shapes
- Use proper typing for all functions
- Avoid `any` type when possible

### React/Next.js

- Use functional components with hooks
- Follow React best practices
- Use proper TypeScript types
- Implement proper error boundaries

### Node.js/Express

- Use async/await for async operations
- Implement proper error handling
- Use middleware for common functionality
- Follow RESTful conventions

## Git Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - Feature branches
- `hotfix/*` - Critical fixes

### Commit Messages

Follow conventional commits:

```
feat: add user authentication
fix: resolve database connection issue
docs: update API documentation
test: add unit tests for user service
```

## Deployment

### Local Development

```bash
# Start infrastructure
docker compose up -d

# Start applications
npm run dev
```

### Production (Railway)

1. Push to `main` branch
2. Railway automatically builds and deploys
3. Monitor deployment in Railway dashboard

### Environment-Specific Configurations

- **Development**: Use `.env.local`
- **Production**: Use Railway environment variables
- **Testing**: Use test database and services

## Troubleshooting

### Common Issues

1. **Docker services not starting**
   ```bash
   docker compose down -v
   docker compose up -d
   ```

2. **Node modules issues**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Database connection issues**
   - Check environment variables
   - Verify Docker services are running
   - Check database logs

### Getting Help

- Check the [Issues](https://github.com/ssvgopal/socialxAdvanced/issues) page
- Review documentation in `/docs`
- Join our community discussions

## Performance Considerations

### Frontend

- Use Next.js Image optimization
- Implement code splitting
- Optimize bundle size
- Use proper caching strategies

### Backend

- Implement database indexing
- Use Redis for caching
- Optimize database queries
- Implement rate limiting

### Database

- Use connection pooling
- Implement proper indexing
- Monitor query performance
- Use read replicas when needed

## Security Best Practices

### Authentication & Authorization

- Use JWT tokens with proper expiration
- Implement refresh tokens
- Use secure password hashing
- Implement proper session management

### Data Protection

- Encrypt sensitive data at rest
- Use HTTPS in production
- Implement proper input validation
- Use parameterized queries

### Infrastructure Security

- Keep dependencies updated
- Use security scanning tools
- Implement proper access controls
- Monitor for security vulnerabilities

---

For more detailed information, refer to the individual service documentation in their respective directories.