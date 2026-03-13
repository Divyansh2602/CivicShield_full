# CivicShield AI - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Start the Python Backend
```bash
# In the project root directory
python main.py
# Backend will run on http://localhost:8000
```

### Step 2: Install Frontend Dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

### Step 3: Set Environment Variables
Create a `.env.local` file in the project root:
```
BACKEND_URL=http://localhost:8000
```

### Step 4: Start the Frontend
```bash
npm run dev
# Frontend will run on http://localhost:3000
```

### Step 5: Open in Browser
Visit [http://localhost:3000](http://localhost:3000) and start using CivicShield AI!

## 📝 How to Use

### 1. Start a Scan
- Go to the home page
- Enter a target URL (e.g., `example.com`)
- Click "Start Scan"
- You'll be redirected to the dashboard

### 2. Monitor Progress
- Dashboard shows real-time scan status
- Metrics update as vulnerabilities are discovered
- Risk score animates as data loads

### 3. View Results
Once the scan completes:
- See detailed vulnerability list
- Check risk gauge and metric cards
- Review security trends
- Download PDF report

### 4. Explore Features
- **Vulnerability Scanner**: Manual scan configuration
- **Attack Surface**: View discovered assets and APIs
- **Phishing Detection**: Monitor phishing attempts
- **API Security**: Track API endpoint security
- **Reports**: Download and manage scan reports
- **Activity Logs**: View security event history
- **Settings**: Configure integrations and preferences

## 🔑 Key Features

### Landing Page
- Enter target URL
- View feature overview
- Learn how it works

### Dashboard
- Cyber Risk Score (0-100)
- Security metrics with animations
- 7-day trend chart
- Vulnerability distribution
- Detailed findings table

### Security Analysis
- Multiple scanning modes (Full, Quick, API)
- Attack surface mapping
- Phishing threat detection
- API endpoint monitoring

### Reports & Logs
- Generate PDF reports
- Search activity logs
- Filter by severity
- Track security events

## 🛠️ Development

### Project Structure
```
.
├── app/                  # Next.js app directory
├── components/          # Reusable React components
├── public/             # Static assets
├── package.json        # Dependencies
└── tailwind.config.ts  # Tailwind configuration
```

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Environment Setup

#### Development
```
BACKEND_URL=http://localhost:8000
```

#### Production
```
BACKEND_URL=https://your-backend-domain.com
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

## 🎨 Customization

### Theme Colors
Edit `app/globals.css`:
```css
:root {
  --background: #0b0f19;
  --foreground: #e0e0e0;
  --primary: #00f5a0;
  --warning: #ffb020;
  --critical: #ff4d4f;
}
```

### Adding New Pages
1. Create file in `app/[page-name]/page.tsx`
2. Import `DashboardHeader` and `SidebarNav`
3. Add navigation item to `components/SidebarNav.tsx`

### Modifying Components
- Core components in `components/` directory
- Edit styling in component files with Tailwind CSS
- Maintain cybersecurity theme consistency

## 🔗 API Integration

### Backend Endpoints Used

#### Start Scan
```
POST /api/scan
Body: { target: "https://example.com" }
Response: { scan_id: 1, status: "queued" }
```

#### Get Scan Status
```
GET /api/scan/{scan_id}
Response: { scan_id: 1, status: "completed", result: {...} }
```

#### Download Report
```
GET /api/report/{scan_id}
Response: PDF file
```

#### Check Phishing
```
POST /api/phishing
Body: { url: "https://example.com" }
Response: { phishing_score: 0.85, ... }
```

## 🐛 Troubleshooting

### Backend Not Connecting
```bash
# Check if backend is running
curl http://localhost:8000

# If not, start it
python main.py
```

### Port Already in Use
```bash
# Change frontend port
npm run dev -- -p 3001

# Or change backend port in main.py
app.run(host="127.0.0.1", port=8001)
```

### Dependencies Not Installing
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
```

### Styles Not Showing
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

## 📱 Responsive Design

- **Mobile**: Sidebar collapses, single column layout
- **Tablet**: Two-column layout, sidebar hidden by default
- **Desktop**: Full sidebar, multi-column grids

## 🔐 Security Notes

1. **API Keys**: Store securely in environment variables
2. **Backend**: Implement authentication on backend
3. **CORS**: Configure properly in Python backend
4. **HTTPS**: Required for production

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Recharts](https://recharts.org)
- [Python FastAPI](https://fastapi.tiangolo.com/)

## ✅ Checklist

- [ ] Backend running on `http://localhost:8000`
- [ ] Frontend dependencies installed
- [ ] `.env.local` configured with `BACKEND_URL`
- [ ] Frontend running on `http://localhost:3000`
- [ ] Can access home page and see landing page
- [ ] Can start a scan with a test URL
- [ ] Dashboard displays results properly

## 🎯 Next Steps

1. ✅ Get it running locally
2. Test all features and pages
3. Customize colors and branding
4. Add authentication
5. Deploy to production

## 📞 Support

For detailed documentation, see `FRONTEND_README.md`

Happy scanning! 🛡️
