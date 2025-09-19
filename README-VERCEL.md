# 🚀 Vercel Deployment Guide - Project ZURICH

## 📁 Project Structure
```
/
├── public/              # All HTML files served by Vercel
│   ├── index.html       # Investment Hub (main page)
│   ├── debt_investment.html
│   ├── equity_investment.html  
│   ├── project-zurich-equity.html
│   ├── directory.html
│   ├── admin-simple.html
│   ├── analytics-dashboard.html
│   ├── health.html      # Health check page
│   └── test.html        # Debug page
├── vercel.json          # Minimal Vercel configuration
└── .vercelignore        # Files to exclude from deployment
```

## 🔧 Vercel Configuration
- **Framework**: Other/Static
- **Build Command**: (leave empty)
- **Output Directory**: `public`
- **Install Command**: (leave empty)

## 🌐 Available URLs After Deployment
- `/` - Investment Hub (main page)
- `/health.html` - Health check (test this first)
- `/debt_investment.html` - Debt investment page
- `/equity_investment.html` - Equity investment page  
- `/project-zurich-equity.html` - Senior financing page
- `/directory.html` - Directory of all pages
- `/admin-simple.html` - Admin panel
- `/analytics-dashboard.html` - Analytics dashboard

## 🧪 Testing Deployment
1. First test: `https://your-domain.vercel.app/health.html`
2. If health check works, test other pages
3. If still 404s, check Vercel project settings

## 🔄 Troubleshooting
- Ensure all files are in `/public/` directory
- Verify vercel.json is minimal (no complex rewrites)
- Check Vercel dashboard for deployment logs
- Try manual redeploy from Vercel dashboard if needed