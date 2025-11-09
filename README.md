# SocialX Advanced

A modern, scalable social platform built with a monorepo architecture, featuring real-time capabilities, AI-powered features, and cloud-native deployment.

## 🏗️ Architecture

This monorepo uses Nx for workspace management and includes:

- **Frontend**: Next.js 14 with React 18, TypeScript, and Tailwind CSS
- **Backend**: Node.js with Express, TypeScript, and RESTful APIs
- **Databases**: PostgreSQL (primary), MongoDB (document storage), Redis (caching)
- **Services**: 
  - MCP (Model Context Protocol) services for AI integrations
  - Agent services for autonomous operations
  - Shared utilities and types
- **Infrastructure**: Docker Compose for local development, Railway for production

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose
- Git

### 1. Clone and Install

```bash
git clone https://github.com/ssvgopal/socialxAdvanced.git
cd socialxAdvanced
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# For local development, you can also use:
cp .env.local .env
```

### 3. Start Infrastructure

```bash
# Start all services (databases, local cloud services)
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

### 4. Development

```bash
# Install dependencies for all packages
npm install

# Start all services in development mode
npm run dev

# Or start individual services
nx serve frontend
nx serve backend
```

## 📁 Project Structure

```
socialx-advanced/
├── apps/
│   ├── frontend/          # Next.js frontend application
│   └── backend/           # Node.js backend API
├── services/
│   ├── mcp/              # Model Context Protocol services
│   └── agents/           # Autonomous agent services
├── packages/
│   └── shared/           # Shared utilities and types
├── docker-compose.yml    # Local development infrastructure
├── .env.example          # Environment variables template
└── README.md
```

## 🛠️ Available Scripts

### Root Level Scripts

- `npm run dev` - Start all applications in development mode
- `npm run build` - Build all applications
- `npm run test` - Run all tests
- `npm run lint` - Lint all code
- `npm run format` - Format code with Prettier
- `npm run docker:up` - Start infrastructure services
- `npm run docker:down` - Stop infrastructure services

### Nx Commands

- `nx serve frontend` - Start frontend development server
- `nx serve backend` - Start backend development server
- `nx build frontend` - Build frontend for production
- `nx build backend` - Build backend for production
- `nx test <project>` - Run tests for specific project
- `nx lint <project>` - Lint specific project

## 🐳 Docker Services

The `docker-compose.yml` includes:

- **PostgreSQL** (port 5432) - Primary relational database
- **MongoDB** (port 27017) - Document storage
- **Redis** (port 6379) - Caching and session storage
- **LocalStack** (port 4566) - AWS services emulation (S3, SQS, Lambda, etc.)
- **Qdrant** (ports 6333/6334) - Vector database for AI features

## 🔧 Configuration

### Environment Variables

Key environment variables:

- `POSTGRES_PASSWORD` - PostgreSQL password
- `MONGO_ROOT_PASSWORD` - MongoDB root password  
- `REDIS_PASSWORD` - Redis password
- `JWT_SECRET` - JWT signing secret
- `ENCRYPTION_KEY` - 32-character encryption key

### Railway Deployment

The project is configured for Railway deployment:

1. Connect your GitHub repository to Railway
2. Railway will automatically detect the services
3. Configure environment variables in Railway dashboard
4. Deploy!

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests for specific project
nx test frontend
nx test backend
nx test shared

# Run tests with coverage
nx test frontend --coverage
```

## 📝 Code Quality

- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **Husky** - Git hooks for pre-commit checks
- **Commitlint** - Conventional commit messages
- **TypeScript** - Static type checking

## 🚢 Deployment

### Local Development

```bash
# Build and run with Docker
docker compose up --build
```

### Production (Railway)

1. Push to main branch
2. Railway auto-deploys
3. Monitor deployment logs in Railway dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Commit Message Format

We use conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions/changes
- `chore:` - Build process or auxiliary tool changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Nx Documentation](https://nx.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Docker Documentation](https://docs.docker.com/)
- [Railway Documentation](https://docs.railway.app/)

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](https://github.com/ssvgopal/socialxAdvanced/issues) page
2. Create a new issue with detailed information
3. Join our community discussions

---

Built with ❤️ by the SocialX team