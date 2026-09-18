# Quick Start Guide - Local Development Setup

## Prerequisites

- Node.js 20+ (with npm)
- Docker Desktop (for databases and Kafka)
- Go 1.21+ (for billing/communication services)
- Python 3.11+ (for AI services)

## Quick Start (5 minutes)

### Step 1: Install Dependencies
```bash
# Install all npm dependencies
npm install

# Install Go dependencies (for Go services)
cd packages/services/billing-service && go mod download
cd packages/services/communication-service && go mod download

# Install Python dependencies (for AI services)
cd packages/services/ai-orchestrator-service && pip install .
cd packages/services/memory-service && pip install .
cd packages/services/analytics-service && pip install .
```

### Step 2: Setup Environment
```bash
# Copy development environment file
cp .env.development.example .env.development

# Edit if needed (default values work for local dev)
```

### Step 3: Start Infrastructure (Docker)
```bash
# Start PostgreSQL, Kafka, Redis
docker-compose up -d postgres kafka redis

# Wait for services to be healthy (about 30 seconds)
docker-compose ps
```

### Step 4: Run Database Migrations
```bash
# Applies all 6 SQL migrations with tracking (idempotent)
npm run db:migrate

# Optional: seed demo users
npm run db:seed
```

Seeded login: `seeker@example.com` / `Password123!` (plus 3 consultant accounts)

### Step 5: Build Shared Package
```bash
cd packages/shared
npm run build
cd ../..
```

### Step 6: Start Services (Development Mode)

**Option A: Start all services via Docker**
```bash
docker-compose up -d
```

**Option B: Start services individually (for development)**
```bash
# Start Node.js services
cd packages/services/user-service && npm run dev &
cd packages/services/consultant-service && npm run dev &
cd packages/services/booking-service && npm run dev &
cd packages/services/notification-service && npm run dev &
cd packages/services/content-service && npm run dev &
cd packages/services/compliance-service && npm run dev &
cd packages/services/integration-service && npm run dev &
cd packages/services/vertical-service && npm run dev &
cd packages/services/whatsapp-bot && npm run dev &

# Start Go services
cd packages/services/billing-service && go run cmd/main.go &
cd packages/services/communication-service && go run cmd/main.go &
cd packages/services/search-service && go run cmd/main.go &

# Start Python services
cd packages/services/ai-orchestrator-service && python main.py &
cd packages/services/memory-service && python main.py &
cd packages/services/analytics-service && python main.py &
```

### Step 7: Start Web Application
```bash
cd packages/web
npm run dev
```

Access the application at: **http://localhost:3000**

## Service URLs

| Service | Port | URL |
|---------|------|-----|
| Web App | 3000 | http://localhost:3000 |
| API Gateway | 8000 | http://localhost:8000 |
| User Service | 3001 | http://localhost:3001 |
| Consultant Service | 3002 | http://localhost:3002 |
| Booking Service | 3003 | http://localhost:3003 |
| Communication Service | 3004 | http://localhost:3004 |
| Billing Service | 3005 | http://localhost:3005 |
| Content Service | 3006 | http://localhost:3006 |
| AI Orchestrator | 3007 | http://localhost:3007 |
| Memory Service | 3008 | http://localhost:3008 |
| Search Service | 3009 | http://localhost:3009 |
| Notification Service | 3010 | http://localhost:3010 |
| Analytics Service | 3011 | http://localhost:3011 |
| Compliance Service | 3012 | http://localhost:3012 |
| Integration Service | 3013 | http://localhost:3013 |
| Vertical Service | 3014 | http://localhost:3014 |
| WhatsApp Bot | 3015 | http://localhost:3015 |
| Grafana | 3300 | http://localhost:3300 (mapped) |
| Prometheus | 9091 | http://localhost:9091 (mapped) |

## Admin Dashboard

```bash
cd packages/admin
npm run dev
```

Access at: **http://localhost:3001** (different port)

## Mobile App

```bash
cd packages/mobile
npm start
```

Then use Expo Go app on your phone or run simulator.

## Testing

```bash
# Run all tests
npm test

# Run E2E tests
cd tests/e2e && npm test

# Run API tests
cd tests/api && npm test

# Run integration tests
cd tests/integration && npm test
```

## Troubleshooting

### PostgreSQL Connection Issues
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Test connection
docker exec consultancy-postgres psql -U postgres -d consultancy -c "SELECT 1"
```

### Kafka Connection Issues
```bash
# Check Kafka is running
docker-compose ps kafka

# List topics
docker exec consultancy-kafka kafka-topics --bootstrap-server localhost:9092 --list
```

### Port Already in Use
```bash
# Check what's using the port
lsof -i :3000

# Kill the process or change the port in .env.development
```

## Development without Docker

If you don't want to use Docker:

1. Install PostgreSQL locally
2. Install Kafka locally (or use mock)
3. Update .env.development with your local settings
4. Run services with `npm run dev`

## Minimal Setup (Just Web + Database)

For quick testing without all services:

```bash
# Start only database
docker-compose up -d postgres

# Run migrations
npm run db:migrate

# Start web app only
cd packages/web && npm run dev
```

The web app will work with mock data for services not running.