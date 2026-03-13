# CivicShield AI - API Integration Guide

This document explains how the Next.js frontend integrates with the Python FastAPI backend.

## Architecture Overview

```
┌─────────────────────┐
│   Next.js Frontend  │
│   (http://3000)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────┐
│   Next.js API Routes        │
│   /app/api/**/route.ts      │
│   (Proxy Layer)             │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│   Python FastAPI Backend    │
│   (http://8000)             │
│   Handles Scanning Logic    │
└─────────────────────────────┘
```

## API Routes

### 1. Scan Management

#### Start New Scan
**Endpoint**: `POST /api/scan`

**Frontend Code** (`app/page.tsx`):
```typescript
const response = await fetch("/api/scan", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ target: fullUrl }),
})
```

**Proxy Route** (`app/api/scan/route.ts`):
- Receives request from frontend
- Forwards to `POST http://localhost:8000/scan`
- Returns scan ID and initial status

**Backend Expected Response**:
```json
{
  "scan_id": 1,
  "status": "queued"
}
```

#### Get Scan Status
**Endpoint**: `GET /api/scan/[scanId]`

**Frontend Code** (`app/dashboard/page.tsx`):
```typescript
const { data: scanData } = useSWR(
  `/api/scan/${scanId}`,
  fetcher,
  { refreshInterval: 2000 } // Poll every 2 seconds
)
```

**Proxy Route** (`app/api/scan/[scanId]/route.ts`):
- Forwards to `GET http://localhost:8000/scan/{scan_id}`
- Returns current scan status and results

**Backend Expected Response**:
```json
{
  "scan_id": 1,
  "status": "completed",
  "result": {
    "target": "https://example.com",
    "findings": [
      {
        "vuln": "SQL Injection",
        "risk": "Critical",
        "url": "/api/login",
        "param": "username",
        "payload": "admin' OR '1'='1",
        "evidence": "Response time increased"
      }
    ]
  }
}
```

### 2. Report Generation

**Endpoint**: `GET /api/report/[scanId]`

**Frontend Code** (`app/dashboard/page.tsx`):
```typescript
const handleDownloadReport = async () => {
  const response = await fetch(`/api/report/${scanId}`)
  const blob = await response.blob()
  // Download PDF
}
```

**Proxy Route** (`app/api/report/[scanId]/route.ts`):
- Forwards to `GET http://localhost:8000/report/{scan_id}`
- Streams PDF binary response
- Sets proper Content-Type and Content-Disposition headers

**Backend Expected Response**:
- Binary PDF file stream
- Content-Type: `application/pdf`

### 3. Phishing Detection

**Endpoint**: `POST /api/phishing`

**Frontend Code** (Future implementation):
```typescript
const response = await fetch("/api/phishing", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url: "https://example.com" }),
})
```

**Proxy Route** (`app/api/phishing/route.ts`):
- Forwards to `POST http://localhost:8000/phishing/check`
- Passes URL as query parameter

**Backend Expected Response**:
```json
{
  "is_phishing": false,
  "phishing_score": 0.15,
  "indicators": []
}
```

## Backend Integration Points

### Current Status
The frontend successfully proxies requests to the Python backend. The backend should provide:

1. **Scan Endpoints**
   - `POST /scan` - Start scanning
   - `GET /scan/{scan_id}` - Get status
   - Both should return JSON responses

2. **Report Endpoint**
   - `GET /report/{scan_id}` - Return PDF file
   - Should set proper headers for file download

3. **Phishing Endpoint**
   - `POST /phishing/check?url=...` - Analyze URL
   - Should return JSON with phishing analysis

### Expected Backend Models

#### Scan Response
```python
{
    "scan_id": int,
    "status": "queued|running|completed|failed",
    "result": {
        "target": str,
        "findings": [
            {
                "vuln": str,          # Vulnerability type
                "vuln_type": str,     # Alternative field
                "risk": str,          # "Critical" | "High" | "Medium" | "Low"
                "url": str,           # Affected endpoint
                "param": str,         # Parameter name
                "payload": str,       # Exploit payload
                "evidence": str       # Proof of vulnerability
            }
        ]
    }
}
```

## Environment Configuration

### Development
```bash
BACKEND_URL=http://localhost:8000
```

### Production
```bash
BACKEND_URL=https://your-api-domain.com
```

## Error Handling

### Frontend Error Handling
```typescript
// All API routes implement standard error responses
if (!response.ok) {
  const data = await response.json()
  throw new Error(data.detail || "Unknown error")
}
```

### Backend Error Format
```json
{
  "detail": "Error message describing what went wrong"
}
```

### Common Errors

| Status | Cause | Solution |
|--------|-------|----------|
| 404 | Scan ID not found | Verify scan_id is correct |
| 400 | Invalid URL format | Ensure URL starts with http:// or https:// |
| 500 | Backend error | Check backend logs |
| 503 | Backend unavailable | Start Python backend |

## Data Flow Examples

### Example 1: Starting a Scan

```
User enters URL on landing page
         │
         ▼
User clicks "Start Scan"
         │
         ▼
Frontend validates URL format
         │
         ▼
Frontend sends POST /api/scan
         │
         ▼
Next.js Route Handler receives request
         │
         ▼
Forwards to http://localhost:8000/scan
         │
         ▼
Python backend starts scanning in background
         │
         ▼
Returns { scan_id: 1, status: "queued" }
         │
         ▼
Frontend redirects to /dashboard?scanId=1
```

### Example 2: Polling for Results

```
Dashboard mounts, scanId=1
         │
         ▼
useSWR starts polling /api/scan/1
         │
         ▼
Every 2 seconds:
  GET /api/scan/1
     │
     ▼
  Next.js forwards to GET /scan/1
     │
     ▼
  Python backend returns current status
     │
     ▼
  useSWR updates state
         │
         ▼
Components re-render with new data
         │
         ▼
When status === "completed", polling stops
```

## Performance Considerations

### Request Optimization
- SWR handles request deduplication
- Polling interval: 2 seconds (configurable)
- Polling stops when scan completes

### Backend Requirements
- Should handle long-running scans (timeout: 30+ seconds)
- Should return progress updates
- Should stream PDF responses

### Frontend Optimization
- Lazy load dashboard components
- Use Suspense for data fetching
- Implement skeleton states during loading

## Authentication (Future)

When implementing authentication:

1. **Frontend**: Add auth token to API requests
```typescript
headers: {
  "Authorization": `Bearer ${token}`,
  "Content-Type": "application/json"
}
```

2. **Backend**: Validate token before processing

3. **Next.js Middleware**: Could intercept and add auth headers automatically

## CORS Configuration

The Python backend must allow requests from frontend:

```python
# In FastAPI main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Monitoring & Debugging

### Frontend Debugging
```typescript
// Add logging in API routes
console.log("[v0] Forwarding to backend:", url)
console.log("[v0] Response status:", response.status)
```

### Backend Debugging
Check Python logs:
```bash
# If running in terminal, check console output
# If running as service, check logs:
journalctl -u civicshield -f
```

### Network Debugging
Use browser DevTools Network tab:
1. Open DevTools (F12)
2. Go to Network tab
3. Perform scan
4. Check requests to `/api/scan` and `/api/scan/[id]`

## Future Enhancements

1. **WebSocket Support**: Replace polling with real-time updates
   ```typescript
   const ws = new WebSocket("ws://localhost:8000/ws/scan/1")
   ```

2. **Streaming Results**: Stream results as they're discovered
   ```typescript
   const response = await fetch("/api/scan/1/stream")
   const reader = response.body.getReader()
   ```

3. **Caching**: Cache scan results to reduce backend load
   ```typescript
   useSWR(key, fetcher, { revalidateOnFocus: false })
   ```

4. **Batch Operations**: Support multiple concurrent scans
   ```typescript
   POST /api/scans/batch
   ```

## Testing

### Manual Testing
1. Start backend: `python main.py`
2. Start frontend: `npm run dev`
3. Test each endpoint in browser DevTools Network tab
4. Verify responses match expected format

### Automated Testing
```bash
# Test API routes
npm test -- app/api/scan/route.ts

# Test frontend integration
npm test -- app/dashboard/page.tsx
```

## References

- [Python FastAPI Backend](../main.py)
- [Frontend README](./FRONTEND_README.md)
- [Quick Start Guide](./QUICK_START.md)
