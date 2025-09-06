# IFSC Lookup Service

A high-performance, scalable service that provides IFSC (Indian Financial System Code) details via REST API with intelligent caching and smart data retrieval.

## 🚀 Features

- **Smart Data Retrieval**: Multi-layered data fetching strategy (Cache → Database → External API)
- **Redis Caching**: Fast response times with configurable TTL
- **MongoDB Storage**: Persistent storage with automatic data freshness management
- **Extensible Design**: Easy integration of additional IFSC API providers
- **Comprehensive Error Handling**: Robust error management and validation
- **API Documentation**: Auto-generated Swagger/OpenAPI documentation
- **Docker Support**: Easy deployment with Docker and Docker Compose
- **Health Monitoring**: Built-in health checks and statistics endpoints
- **TypeScript**: Full type safety and modern development experience

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Redis Cache   │    │   MongoDB       │    │  External APIs  │
│   (Fast Access) │    │   (Persistent)  │    │  (Razorpay etc) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  NestJS Service │
                    │                 │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   REST API      │
                    │   (Public)      │
                    └─────────────────┘
```

## 📋 Requirements

- Node.js 18+ 
- MongoDB 4.4+
- Redis 6.0+
- npm or yarn

## 🛠️ Installation & Setup

### Quick Start with Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd brixo-ifsc-service
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Verify the setup**
   ```bash
   curl http://localhost:3000/api/ifsc/health/check
   ```

4. **Test the API**
   ```bash
   curl http://localhost:3000/api/ifsc/HDFC0CAGSBK
   ```

### Local Development Setup

1. **Prerequisites**
   - Node.js 18+
   - MongoDB 4.4+
   - Redis 6.0+

2. **Clone and install**
   ```bash
   git clone <repository-url>
   cd brixo-ifsc-service
   npm install
   ```

3. **Environment configuration**
   ```bash
   cp env.example .env
   # Edit .env with your local configuration
   ```

4. **Start dependencies**
   ```bash
   # Using Docker (recommended)
   docker-compose up -d mongodb redis
   
   # Or install locally
   brew services start mongodb/brew/mongodb-community
   brew services start redis
   ```

5. **Start development server**
   ```bash
   npm run start:dev
   ```

### Docker Deployment

1. **Using Docker Compose (Recommended)**
   ```bash
   docker-compose up -d
   ```

2. **Using Docker only**
   ```bash
   # Build the image
   docker build -t ifsc-service .
   
   # Run with external MongoDB and Redis
   docker run -d -p 3000:3000 \
     -e MONGODB_URI=mongodb://your-mongo-host:27017/ifsc-service \
     -e REDIS_HOST=your-redis-host \
     ifsc-service
   ```

## 📖 Documentation

### API Documentation
- **Interactive Swagger UI**: http://localhost:3000/api/docs
- **API Reference**: [docs/API.md](docs/API.md)

### Technical Documentation
- **Database Schema**: [docs/database/schema.md](docs/database/schema.md)
- **Docker Setup**: [docs/DOCKER.md](docs/DOCKER.md)

### Endpoints

#### 1. Get IFSC Details
```http
GET /api/ifsc/{ifsc_code}
```

**Parameters:**
- `ifsc_code` (string): 11-character IFSC code (e.g., HDFC0CAGSBK)

**Response:**
```json
{
  "ifsc": "HDFC0CAGSBK",
  "details": {
    "IFSC": "HDFC0CAGSBK",
    "BANK": "HDFC Bank",
    "BRANCH": "THE AGS EMPLOYEES COOP BANK LTD",
    "CENTRE": "BANGALORE URBAN",
    "DISTRICT": "BANGALORE URBAN",
    "STATE": "KARNATAKA",
    "ADDRESS": "SANGMESH BIRADAR BANGALORE",
    "CONTACT": "+91802265658",
    "IMPS": true,
    "RTGS": true,
    "CITY": "BANGALORE",
    "ISO3166": "IN-KA",
    "NEFT": true,
    "MICR": "560226263",
    "SWIFT": "HDFCINBB",
    "UPI": true
  },
  "source": "external_api",
  "lastUpdated": "2025-09-06T12:39:26.362Z"
}
```

**Status Codes:**
- `200`: Success
- `400`: Invalid IFSC format
- `404`: IFSC not found
- `503`: External service unavailable

#### 2. Get Service Statistics
```http
GET /api/ifsc/stats/summary
```

**Response:**
```json
{
  "totalRecords": 1,
  "freshRecords": 1,
  "staleRecords": 0,
  "dataFreshnessDays": 30
}
```

#### 3. Health Check
```http
GET /api/ifsc/health/check
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-09-06T12:39:16.923Z",
  "service": "IFSC Lookup Service"
}
```

## 🧠 Smart Data Retrieval Logic

The service implements a three-tier data retrieval strategy:

1. **Cache First**: Check Redis cache for instant response
2. **Database Second**: If not cached, check MongoDB for stored data
   - Return if data is fresh (within configured days)
   - Proceed to external API if stale
3. **External API Third**: Fetch from Razorpay API
   - Update database with fresh data
   - Cache the result
   - Return stale database data as fallback if API fails

## ⚙️ Configuration

| Environment Variable | Description | Default |
|---------------------|-------------|---------|
| `PORT` | Application port | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/ifsc-service` |
| `DATABASE_NAME` | MongoDB database name | `ifsc-service` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password | `` |
| `CACHE_TTL` | Cache TTL in seconds | `300` |
| `DATA_FRESHNESS_DAYS` | Days to consider data fresh | `30` |
| `RAZORPAY_IFSC_BASE_URL` | Razorpay API base URL | `https://ifsc.razorpay.com` |

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm test

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

### Manual Testing
```bash
# Test valid IFSC
curl "http://localhost:3000/api/ifsc/HDFC0CAGSBK"

# Test invalid IFSC
curl "http://localhost:3000/api/ifsc/INVALID123"

# Test statistics
curl "http://localhost:3000/api/ifsc/stats/summary"
```

## 🔧 Development

### Project Structure
```
src/
├── config/                 # Configuration files
├── common/                 # Shared utilities
│   ├── dto/               # Data Transfer Objects
│   ├── interfaces/        # TypeScript interfaces
│   └── exceptions/        # Custom exceptions
├── database/              # Database schemas
│   └── schemas/
├── modules/               # Feature modules
│   ├── cache/            # Redis cache module
│   └── ifsc/             # IFSC lookup module
│       ├── providers/    # External API providers
│       └── __tests__/    # Unit tests
├── app.module.ts          # Main application module
└── main.ts               # Application entry point
```

### Scripts
```bash
npm run build          # Build the application
npm run start          # Start production server
npm run start:dev      # Start development server
npm run start:debug    # Start with debugging
npm run lint           # Run ESLint
npm run test           # Run tests
npm run test:cov       # Run tests with coverage
```

## 📊 Performance Considerations

- **Caching**: Redis provides sub-millisecond response times for cached data
- **Database Indexing**: IFSC field is indexed for fast lookups
- **Connection Pooling**: MongoDB and Redis connections are pooled
- **Error Handling**: Graceful degradation when external services fail
- **Data Freshness**: Configurable staleness threshold prevents unnecessary API calls


## 📝 API Examples

### cURL Examples
```bash
# Get IFSC details
curl -X GET "http://localhost:3000/api/ifsc/HDFC0CAGSBK" \
  -H "accept: application/json"

# Get service statistics
curl -X GET "http://localhost:3000/api/ifsc/stats/summary" \
  -H "accept: application/json"

# Health check
curl -X GET "http://localhost:3000/api/ifsc/health/check" \
  -H "accept: application/json"
```


