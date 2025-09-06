# Database Schema Documentation

## Overview
The IFSC Lookup Service uses MongoDB as the primary database with a single collection to store IFSC (Indian Financial System Code) details.

## Database: `ifsc-service`

### Collection: `ifscs`

#### Schema Structure

```javascript
{
  _id: ObjectId,                    // MongoDB auto-generated ID
  IFSC: String,                     // IFSC code (unique, indexed)
  BANK: String,                     // Bank name
  BRANCH: String,                   // Branch name
  CENTRE: String,                   // Centre/City name
  DISTRICT: String,                 // District name
  STATE: String,                    // State name
  ADDRESS: String,                  // Full branch address
  CONTACT: String,                  // Contact number
  IMPS: Boolean,                    // IMPS enabled flag
  RTGS: Boolean,                    // RTGS enabled flag
  CITY: String,                     // City name
  ISO3166: String,                  // ISO state code
  NEFT: Boolean,                    // NEFT enabled flag
  MICR: String,                     // MICR code
  SWIFT: String,                    // SWIFT code
  UPI: Boolean,                     // UPI enabled flag
  lastUpdated: Date,                // Last update timestamp
  createdAt: Date,                  // Record creation timestamp
  updatedAt: Date                   // Record update timestamp
}
```

#### Indexes

```javascript
// Primary index on IFSC code for fast lookups
db.ifscs.createIndex({ "IFSC": 1 }, { unique: true })

// Index on lastUpdated for data freshness queries
db.ifscs.createIndex({ "lastUpdated": 1 })

// Compound index for bank and state queries (optional)
db.ifscs.createIndex({ "BANK": 1, "STATE": 1 })
```

#### Sample Document

```json
{
  "_id": "507f1f77bcf86cd799439011",
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
  "UPI": true,
  "lastUpdated": "2025-09-06T12:39:26.362Z",
  "createdAt": "2025-09-06T12:39:26.362Z",
  "updatedAt": "2025-09-06T12:39:26.362Z"
}
```

## Data Migration

### Initial Setup
No manual migrations are required. The application uses Mongoose with automatic schema validation.

### Schema Evolution
- The schema is defined in `src/database/schemas/ifsc.schema.ts`
- Mongoose handles automatic index creation on application startup
- New fields can be added to the schema without breaking existing data

### Data Freshness Management
- Records are considered "fresh" for 30 days (configurable via `DATA_FRESHNESS_DAYS`)
- Stale records are automatically updated when requested
- No manual cleanup required - data is updated on-demand

## Performance Considerations

### Indexing Strategy
1. **Primary Index**: `IFSC` field (unique) - O(1) lookup performance
2. **Freshness Index**: `lastUpdated` field - Fast stale data queries
3. **Compound Indexes**: Can be added for specific query patterns

### Storage Estimates
- Average document size: ~500 bytes
- 100,000 IFSC codes: ~50MB storage
- 1,000,000 IFSC codes: ~500MB storage

### Query Patterns
```javascript
// Find by IFSC (most common)
db.ifscs.findOne({ "IFSC": "HDFC0CAGSBK" })

// Find stale records
db.ifscs.find({ 
  "lastUpdated": { 
    $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
  } 
})

// Count fresh vs stale records
db.ifscs.aggregate([
  {
    $group: {
      _id: {
        $cond: [
          { $gte: ["$lastUpdated", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
          "fresh",
          "stale"
        ]
      },
      count: { $sum: 1 }
    }
  }
])
```

## Backup and Recovery

### Backup Strategy
```bash
# Create backup
mongodump --db ifsc-service --out /backup/$(date +%Y%m%d)

# Restore backup
mongorestore --db ifsc-service /backup/20250906/ifsc-service
```

### Data Consistency
- All writes use MongoDB's default write concern (w: majority)
- Atomic updates ensure data consistency
- No transactions required for single-document operations
