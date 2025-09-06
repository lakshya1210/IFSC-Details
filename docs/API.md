# API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication
No authentication required for this service.

## Content Type
All requests and responses use `application/json`.

---

## Endpoints

### 1. Get IFSC Details

**Endpoint:** `GET /api/ifsc/{ifsc_code}`

**Description:** Retrieve bank details for a specific IFSC code.

**Parameters:**
- `ifsc_code` (path parameter, required): 11-character IFSC code
  - Format: `ABCD0123456` (4 letters + 1 zero + 6 alphanumeric)
  - Example: `HDFC0CAGSBK`

**Request Example:**
```http
GET /api/ifsc/HDFC0CAGSBK
Accept: application/json
```

**Response (200 OK):**
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

**Error Responses:**

**400 Bad Request** - Invalid IFSC format:
```json
{
  "statusCode": 400,
  "message": "Invalid IFSC code format. Expected format: ABCD0123456",
  "error": "Invalid IFSC Format"
}
```

**404 Not Found** - IFSC not found:
```json
{
  "statusCode": 404,
  "message": "IFSC code 'INVALID123' not found",
  "error": "IFSC Not Found"
}
```

**503 Service Unavailable** - External API error:
```json
{
  "statusCode": 503,
  "message": "External API error: Connection timeout",
  "error": "External Service Unavailable"
}
```

---

### 2. Get Service Statistics

**Endpoint:** `GET /api/ifsc/stats/summary`

**Description:** Get statistics about cached and stored IFSC data.

**Request Example:**
```http
GET /api/ifsc/stats/summary
Accept: application/json
```

**Response (200 OK):**
```json
{
  "totalRecords": 1250,
  "freshRecords": 1100,
  "staleRecords": 150,
  "dataFreshnessDays": 30
}
```

**Response Fields:**
- `totalRecords`: Total IFSC records in database
- `freshRecords`: Records updated within freshness period
- `staleRecords`: Records older than freshness period
- `dataFreshnessDays`: Configured freshness threshold in days

---

### 3. Health Check

**Endpoint:** `GET /api/ifsc/health/check`

**Description:** Check if the service is running and healthy.

**Request Example:**
```http
GET /api/ifsc/health/check
Accept: application/json
```

**Response (200 OK):**
```json
{
  "status": "OK",
  "timestamp": "2025-09-06T12:39:16.923Z",
  "service": "IFSC Lookup Service"
}
```

---

### 4. Interactive API Documentation

**Endpoint:** `GET /api/docs`

**Description:** Swagger/OpenAPI interactive documentation interface.

**Access:** Open `http://localhost:3000/api/docs` in your browser for interactive API testing.

---

## Data Sources

The service uses a smart data retrieval strategy:

1. **Cache (Redis)** - Fastest response (~1ms)
2. **Database (MongoDB)** - Fast response (~10ms) 
3. **External API (Razorpay)** - Slower response (~500ms)

The `source` field in responses indicates where the data came from:
- `"database"` - Retrieved from local database
- `"external_api"` - Fetched from external API and cached

---

## Rate Limiting

Currently no rate limiting is implemented, but can be added using `@nestjs/throttler`.

---

## Error Handling

All errors follow a consistent format:
```json
{
  "statusCode": 400,
  "message": "Descriptive error message",
  "error": "Error Type"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (invalid input)
- `404` - Not Found (IFSC doesn't exist)
- `500` - Internal Server Error
- `503` - Service Unavailable (external API down)

---

## Testing Examples

### cURL Commands

```bash
# Valid IFSC lookup
curl "http://localhost:3000/api/ifsc/HDFC0CAGSBK"

# Invalid IFSC format
curl "http://localhost:3000/api/ifsc/INVALID"

# Service statistics
curl "http://localhost:3000/api/ifsc/stats/summary"

# Health check
curl "http://localhost:3000/api/ifsc/health/check"
```

### JavaScript/Node.js

```javascript
const axios = require('axios');

async function getIFSCDetails(ifscCode) {
  try {
    const response = await axios.get(`http://localhost:3000/api/ifsc/${ifscCode}`);
    console.log('IFSC Details:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
getIFSCDetails('HDFC0CAGSBK');
```

### Python

```python
import requests

def get_ifsc_details(ifsc_code):
    try:
        response = requests.get(f'http://localhost:3000/api/ifsc/{ifsc_code}')
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Error: {e}')
        raise

# Usage
data = get_ifsc_details('HDFC0CAGSBK')
print(data)
```
