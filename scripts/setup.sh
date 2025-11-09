#!/bin/bash

# Development setup script for SocialX Advanced

set -e

echo "🚀 Setting up SocialX Advanced development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.local .env
    echo "⚠️  Please review and update the .env file with your configuration"
fi

# Make scripts executable
echo "🔧 Making scripts executable..."
chmod +x scripts/*.sh

# Start infrastructure services
echo "🐳 Starting infrastructure services..."
docker compose up -d postgres mongodb redis localstack vector-db

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check if services are healthy
echo "🔍 Checking service health..."
docker compose ps

echo ""
echo "✅ Development environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Review and update .env file if needed"
echo "2. Run 'npm run dev' to start development servers"
echo "3. Visit http://localhost:3000 for the frontend"
echo "4. Visit http://localhost:4000/health for the backend API"
echo ""
echo "To stop infrastructure: npm run docker:down"
echo "To view logs: npm run docker:logs"