# Vercel Deployment Guide

## Problem Solved
The 404 error was caused by:
1. Frontend using incorrect API URL on Vercel
2. CORS not allowing Vercel domains
3. No backend configuration for Vercel serverless deployment

## Solution Applied

### Files Created/Updated:
1. **vercel.json** - Vercel build configuration
2. **api/index.js** - Serverless backend entry point
3. **.env.example** - Environment variable template
4. **frontend/.env.local** - Frontend API URL configuration
5. **backend/src/index.js** - Updated CORS settings

## How to Deploy on Vercel

### Step 1: Deploy Frontend
```bash
npm install -g vercel
vercel login
cd learning-platform/frontend
vercel deploy --prod
# Note the frontend URL (e.g., https://your-frontend.vercel.app)
```

### Step 2: Deploy Backend API
```bash
cd learning-platform
vercel deploy --prod
```

### Step 3: Set Environment Variables in Vercel Dashboard

Go to **Vercel Dashboard** → **Project Settings** → **Environment Variables**

Add these variables:
```
REACT_APP_API_URL = https://your-api-domain.vercel.app/api
FRONTEND_URL = https://your-frontend-domain.vercel.app
```

### Step 4: Redeploy to Apply Environment Variables
```bash
vercel deploy --prod
```

## For Local Development
Your `.env.local` file is already configured for localhost:
```
REACT_APP_API_URL=http://localhost:5000/api
```

Run with:
```bash
npm run dev
```

## How It Works Now

1. **Frontend** reads API URL from `REACT_APP_API_URL` environment variable
2. **Backend** sets CORS to allow:
   - localhost (development)
   - `FRONTEND_URL` (production)
   - `VERCEL_URL` (automatic Vercel domain)
3. **Vercel Functions** automatically handle the backend serverless deployment

## Testing

After deployment, verify:
```bash
# Test health check
curl https://your-api-domain.vercel.app/health

# Test frontend can reach API
# Open browser console and check Network tab for /api calls
```

## Troubleshooting

If you still see 404 errors:
1. Check browser console for actual API URL being used
2. Verify environment variables in Vercel Dashboard
3. Check CORS origin headers match your frontend domain
4. Redeploy after changing environment variables
