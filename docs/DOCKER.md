# Docker Setup Documentation

## Overview
The IFSC Lookup Service is fully containerized using Docker and Docker Compose for easy deployment and development.

## Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+

## Quick Start

### Using Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd brixo-ifsc-service
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Verify deployment**
   ```bash
   curl http://localhost:3000/api/ifsc/health/check
   ```

4. **Stop services**
   ```bash
   docker-compose down
   ```

## Architecture

### Services Overview

```yaml
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │    │    MongoDB      │    │     Redis       │
│   (Port 3000)   │    │   (Port 27017)  │    │   (Port 6379)   │
│                 │    │                 │    │                 │
│  NestJS API     │◄──►│  Data Storage   │    │  Cache Layer    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Docker Compose Services

#### 1. Application Service (`app`)
- **Image**: Built from local Dockerfile
- **Port**: 3000 (mapped to host)
- **Dependencies**: MongoDB, Redis
- **Environment**: Production configuration
- **Restart Policy**: `unless-stopped`

#### 2. MongoDB Service (`mongodb`)
- **Image**: `mongo:7.0`
- **Port**: 27017 (mapped to host)
- **Volume**: `mongodb_data` for persistence
- **Database**: `ifsc-service`
- **Restart Policy**: `unless-stopped`

#### 3. Redis Service (`redis`)
- **Image**: `redis:7.2-alpine`
- **Port**: 6379 (mapped to host)
- **Volume**: `redis_data` for persistence
- **Configuration**: Append-only file enabled
- **Restart Policy**: `unless-stopped`

## Configuration

### Environment Variables

The application uses the following environment variables in Docker:

```yaml
environment:
  - NODE_ENV=production
  - MONGODB_URI=mongodb://mongodb:27017/ifsc-service
  - REDIS_HOST=redis
  - REDIS_PORT=6379
  - CACHE_TTL=300
  - DATA_FRESHNESS_DAYS=30
  - RAZORPAY_IFSC_BASE_URL=https://ifsc.razorpay.com
```

### Custom Configuration

Create a `.env` file to override default settings:

```bash
# .env file
PORT=3000
CACHE_TTL=600
DATA_FRESHNESS_DAYS=15
```

Then use it with Docker Compose:
```bash
docker-compose --env-file .env up -d
```

## Development Setup

### Local Development with Docker

1. **Build development image**
   ```bash
   docker build -t ifsc-service:dev .
   ```

2. **Run with external services**
   ```bash
   # Start only MongoDB and Redis
   docker-compose up -d mongodb redis
   
   # Run app locally
   npm run start:dev
   ```

### Hot Reload Development

```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  app:
    build: .
    volumes:
      - ./src:/app/src
      - ./package.json:/app/package.json
    command: npm run start:dev
    environment:
      - NODE_ENV=development
```

```bash
docker-compose -f docker-compose.dev.yml up
```

## Production Deployment

### Build Production Image

```bash
# Build optimized production image
docker build -t ifsc-service:prod .

# Tag for registry
docker tag ifsc-service:prod your-registry/ifsc-service:latest

# Push to registry
docker push your-registry/ifsc-service:latest
```

### Production Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  app:
    image: your-registry/ifsc-service:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/ifsc-service
      - REDIS_HOST=redis
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
    restart: unless-stopped
```

## Dockerfile Explanation

### Multi-stage Build

```dockerfile
# Stage 1: Dependencies
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Build
COPY . .
RUN npm run build

# Stage 3: Runtime
USER nestjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/ifsc/health/check || exit 1
CMD ["npm", "run", "start:prod"]
```

### Security Features
- **Non-root user**: Runs as `nestjs` user (UID 1001)
- **Minimal base image**: Uses Alpine Linux
- **Health checks**: Built-in container health monitoring
- **Resource limits**: Memory and CPU constraints

## Monitoring and Logs

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f mongodb
docker-compose logs -f redis

# Last 100 lines
docker-compose logs --tail=100 app
```

### Health Checks

```bash
# Check container health
docker ps

# Manual health check
docker exec ifsc-app curl -f http://localhost:3000/api/ifsc/health/check
```


### Database Backup/Restore

```bash
# Backup MongoDB
docker-compose exec mongodb mongodump --db ifsc-service --out /data/backup

# Restore MongoDB
docker-compose exec mongodb mongorestore --db ifsc-service /data/backup/ifsc-service
```

