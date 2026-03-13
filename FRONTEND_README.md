# CivicShield AI - Enterprise Cybersecurity Platform

A modern, AI-powered cybersecurity intelligence and vulnerability detection system built with Next.js, Tailwind CSS, and integrated with a Python FastAPI backend.

## Features

### Landing Page
- Professional hero section with compelling copy
- Direct URL input for starting security scans
- Feature overview with clear value propositions
- How-it-works step-by-step guide

### Dashboard
- **Cyber Risk Score** - Animated circular gauge showing overall security risk (0-100)
- **AI Threat Insights** - Framer-Motion powered rotating threat intelligence panel with live glowing UI elements
- **Cyber Attack World Map** - Custom React vector map visualizing live server threats with animated CSS laser paths
- **Security Metrics** - 3D Hover Lift cards displaying:
  - SQL Injection vulnerabilities
  - Cross-Site Scripting (XSS) vulnerabilities
  - API vulnerabilities
  - Security misconfigurations
- **Security Trends** - 7-day historical chart of security incidents
- **Vulnerability Distribution** - Bar chart showing critical, high, and medium vulnerabilities
- **Vulnerability Details** - Expandable table with payload and evidence information

### Vulnerability Scanner
- Target URL input with validation
- Multiple scan type options (Full, Quick, API)
- Real-time scan progress tracking (Powered by SWR)
- **Premium Skeleton UI** - Uses physical pulsing shimmers instead of standard loading spinners while waiting for data
- Detailed vulnerability results with severity levels
- Filtering and sorting capabilities

### Attack Surface Analysis
- Asset summary (domains, subdomains, APIs, servers)
- **Interactive Network Visualization** - Powered by `react-force-graph-2d` plotting discovered nodes dynamically via D3 physics
- Discovered assets table with risk indicators
- High-risk asset highlighting

### Phishing Detection
- Suspicious email detection and analysis
- Threat score visualization with progress bars
- Confidence level indicators
- Action tracking (Blocked, Quarantined, Flagged)

### API Security Monitor
- Total API count and protection status
- JWT authentication verification
- Request volume tracking
- Threat detection for each endpoint
- Real-time API security metrics

### Reports
- Professional report generation interface
- Report history with vulnerability counts
- PDF download capability
- Severity filtering options
- **Toast Notifications** - Built-in `react-hot-toast` dark aesthetic notifications

### Activity Logs
- Searchable security event log viewer
- Threat type filtering
- Severity-based filtering
- Timestamp range selection
- IP address tracking

### Settings
- Profile configuration
- API key management with visibility toggle
- Notification preferences
- System integrations (Slack, Email, GitHub)
- Security settings (2FA, API key requirements)

## Tech Stack

- **Frontend Framework**: Next.js 14+ with React 18 & TypeScript
- **Styling**: Tailwind CSS with custom Glassmorphism cybersecurity theme
- **Animations**: Framer Motion (3D Hover Lifts, Shimmer States, Component mounting)
- **Charts**: Recharts & React Force Graph 2D (Network mapping)
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Data Fetching**: SWR for client-side caching
- **Backend Integration**: Python FastAPI

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- Python 3.8+ with FastAPI backend running
- Environment variables configured

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd civicshield-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and set:
   ```
   BACKEND_URL=http://localhost:8000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm run start
```

## API Routes

All API routes proxy requests to the Python FastAPI backend:

- `POST /api/scan` - Start a new vulnerability scan
- `GET /api/scan/[scanId]` - Get scan status and results
- `GET /api/report/[scanId]` - Download PDF report
- `POST /api/phishing` - Check URL for phishing threats

## Backend Integration

The frontend expects a Python FastAPI backend running on `http://localhost:8000` with the following endpoints:

- `POST /scan` - Submit target for scanning
- `GET /scan/{scan_id}` - Get scan status
- `GET /report/{scan_id}` - Generate PDF report
- `POST /phishing/check` - Analyze phishing threats

Ensure the backend is running before starting the frontend.

## Design System

### Color Palette
- **Background**: `#0b0f19` (Dark Navy)
- **Card**: `#121826` (Slightly Lighter Navy)
- **Primary Accent**: `#00f5a0` (Neon Green)
- **Warning**: `#ffb020` (Amber)
- **Critical**: `#ff4d4f` (Red)

### Features
- **Glassmorphism** - Semi-transparent cards with backdrop blur
- **Glow Effects** - Pulsing neon highlights on key metrics
- **Grid Background** - Subtle cyber grid pattern
- **Smooth Transitions** - Animated number counters and progress bars
- **Responsive Design** - Fully mobile-optimized

## Project Structure

```text
app/
├── api/                    # API routes (proxies to Python backend)
│   ├── scan/
│   ├── phishing/
│   └── report/
├── dashboard/             # Main analytics dashboard
├── scanner/              # Vulnerability scanner interface
├── surface/              # Attack surface analysis
├── phishing/             # Phishing detection
├── api-security/         # API security monitoring
├── reports/              # Report generation
├── logs/                 # Activity logs
├── settings/             # User settings
├── globals.css           # Global styles and theme (@keyframes shimmer, hover-lift)
└── layout.tsx            # Root layout (react-hot-toast Toaster)

components/
├── AIThreatInsights.tsx   # Framer-Motion AI feed panel
├── DashboardHeader.tsx    # Top navigation
├── MetricCard.tsx         # Metric cards with 3D hover animations
├── RiskGaugeCard.tsx      # Risk score visualization
├── SidebarNav.tsx         # Side nav (Responsive Mobile Drawer + framer-motion)
├── SkeletonLoader.tsx     # Pulsing Next.js UI Shimmer loaders
├── VulnerabilityTable.tsx # Vulnerability details table
└── WorldMap.tsx           # Cyber Attack interactive SVG network map
```

## Key Features Implementation

### Real-time Scanning
- Dashboard polls backend for scan status updates every 2 seconds
- Automatic transition to results when scan completes
- Live progress indication

### Risk Scoring
- Weighted algorithm based on vulnerability severity
- Animated gauge with color-coded risk levels
- Dynamic categorization (Critical/High/Medium/Low)

### Data Visualization
- Recharts integration for interactive charts
- Custom tooltip styling matching theme
- Responsive chart sizing

### User Experience
- Skeleton loading states during data fetch
- Smooth page transitions
- Toast notifications for user actions
- Collapsible sidebar for mobile optimization

## Environment Variables

```
BACKEND_URL         # URL of Python FastAPI backend (default: http://localhost:8000)
NEXT_PUBLIC_SUPABASE_URL    # Supabase URL (optional)
NEXT_PUBLIC_SUPABASE_ANON_KEY # Supabase anon key (optional)
```

## Troubleshooting

### Backend Connection Error
- Ensure Python backend is running on `BACKEND_URL`
- Check CORS configuration in Python backend
- Verify network connectivity

### Scans Not Starting
- Check backend `/scan` endpoint is accessible
- Verify target URL format (should start with http:// or https://)
- Check browser console for error messages

### Styling Issues
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Ensure Tailwind CSS is properly configured

## Performance Optimizations

- Image optimization with Next.js Image component
- Code splitting and lazy loading
- SWR for automatic request deduplication
- Tailwind CSS purging for smaller bundle size

## Security Considerations

- All API calls go through Next.js middleware
- Backend authentication should be implemented
- API keys should be stored securely
- HTTPS required for production deployment

## Future Enhancements

- WebSocket support for real-time scan updates
- User authentication and multi-tenant support
- Advanced filtering and search capabilities
- Custom dashboard widget configuration
- Email and Slack notifications
- Scheduled automated scanning

## Support

For issues or questions, please check:
1. Backend logs for API errors
2. Browser console for frontend errors
3. Network tab to verify API requests

## License

© 2026 CivicShield AI. All rights reserved.
