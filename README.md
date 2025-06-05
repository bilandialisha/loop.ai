# Data Ingestion API

A RESTful API system for batch processing data with priority queuing and rate limiting.

## Features

- Asynchronous batch processing
- Priority-based queuing (HIGH, MEDIUM, LOW)
- Rate limiting (3 IDs per 5 seconds)
- Real-time status tracking
- Health monitoring

## API Endpoints

### POST /ingest
Submit data for batch processing.

```json
{
  "ids": [1, 2, 3, 4, 5],
  "priority": "HIGH" // HIGH, MEDIUM, LOW
}
```

### GET /status/:ingestionId
Check processing status of submitted batch.

### GET /health
Monitor API health status.

## Setup & Running

1. Install dependencies:
```bash
npm install
```

2. Start server:
```bash
npm start
```

3. Run tests:
```bash
npm test
```

## Design Decisions

1. **Batch Processing**: Processing in batches of 3 IDs to optimize throughput
2. **Priority Queue**: Ensures high-priority requests are processed first
3. **Rate Limiting**: Maintains 1 batch per 5 seconds to prevent overload
4. **Status Tracking**: Real-time monitoring of batch processing status
