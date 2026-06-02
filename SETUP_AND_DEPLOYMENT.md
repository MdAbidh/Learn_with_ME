# 🚀 Learning Platform - Complete Setup & Deployment Guide

## PART 1: Local Development Setup

### Step 1.1: Create Environment Files (Windows)

**Option A: Automatic Setup (Easy)**
```bash
cd learning-platform
setup.bat
```

**Option B: Manual Setup**

Create these files:

#### File 1: `learning-platform/.env`
```env
# Frontend Configuration
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development

# Backend Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

#### File 2: `learning-platform/frontend/.env.local`
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
```

#### File 3: `learning-platform/backend/.env`
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Step 1.2: Install Dependencies

```bash
cd learning-platform

# Install all dependencies
npm run install:all

# Or manually:
npm install
npm install --prefix backend
npm install --prefix frontend
```

### Step 1.3: Run Development Server

```bash
# From learning-platform directory
npm run dev

# This will:
# - Start backend on http://localhost:5000
# - Start frontend on http://localhost:3000
# - Both connected properly
```

### Step 1.4: Test Local Setup

1. Open browser: **http://localhost:3000**
2. Open browser console (F12)
3. You should see:
   - NO CORS errors
   - NO 404 errors
   - Data loading from backend

---

## PART 2: Vercel Deployment

### Step 2.1: Setup Vercel Account & Project

1. Go to [vercel.com](https://vercel.com)
2. Sign up / Login
3. Click "Add New" → "Project"
4. Connect your Git repository

### Step 2.2: Set Environment Variables in Vercel

**Dashboard Path**: Project Settings → Environment Variables

**Add These Variables**:

| Variable | Value |
|----------|-------|
| `REACT_APP_API_URL` | `https://your-backend-domain.vercel.app/api` |
| `FRONTEND_URL` | `https://your-frontend-domain.vercel.app` |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |

### Step 2.3: Deploy Frontend First

```bash
# Login to Vercel
npm install -g vercel
vercel login

# Deploy frontend
cd learning-platform/frontend
vercel deploy --prod
```

**Copy your frontend URL**, e.g.: `https://my-frontend.vercel.app`

### Step 2.4: Deploy Backend API

```bash
# From project root
cd learning-platform
vercel deploy --prod
```

**Copy your backend URL**, e.g.: `https://my-backend.vercel.app`

### Step 2.5: Update Environment Variables

1. Go to **Vercel Dashboard** → Your Project
2. Click **Settings** → **Environment Variables**
3. Update with your actual domains:

```
REACT_APP_API_URL = https://my-backend.vercel.app/api
FRONTEND_URL = https://my-frontend.vercel.app
```

4. **Redeploy** to apply changes:
```bash
vercel deploy --prod
```

### Step 2.6: Verify Deployment

Test your API:
```bash
curl https://your-backend.vercel.app/health
# Should return: {"status":"ok","timestamp":"2024-..."}
```

Check frontend:
- Visit: `https://your-frontend.vercel.app`
- Open Console (F12)
- Should load without errors

---

## PART 3: Troubleshooting

### ❌ Still Getting 404 Error?

**Check 1: API URL in Browser Console**
```javascript
// Open browser console and run:
console.log(process.env.REACT_APP_API_URL)

// Should show: https://your-backend.vercel.app/api
// NOT: http://localhost:5000/api
```

**Check 2: CORS Headers**
```bash
# Test from terminal:
curl -H "Origin: https://your-frontend.vercel.app" \
  https://your-backend.vercel.app/api/courses
  
# Should NOT show CORS error
```

**Check 3: Redeploy After Environment Changes**
```bash
# After changing env vars in Vercel:
vercel deploy --prod

# Wait 2-3 minutes for deployment to complete
```

### ❌ Environment Variables Not Working?

1. **Check they're saved in Vercel**:
   - Vercel Dashboard → Project → Settings → Environment Variables
   - Should see all variables listed

2. **Redeploy required**:
   ```bash
   vercel deploy --prod
   ```

3. **Clear browser cache**:
   - Ctrl+Shift+Delete
   - Clear all cache
   - Reload page

### ❌ Database Connection Error?

**This is normal** - Vercel is serverless. For production:

1. Use **MongoDB** or **PostgreSQL** instead of SQLite
2. Update `backend/src/utils/database.js` to use cloud database
3. Set database URL in environment variables

For now, local SQLite works fine for development.

---

## PART 4: Quick Reference Commands

```bash
# Local Development
npm run dev                    # Start both frontend & backend

# Individual servers
npm run dev --prefix backend   # Just backend
npm start --prefix frontend    # Just frontend

# Building
npm run build                  # Build frontend
npm run build --prefix backend # Prepare backend

# Deployment
vercel deploy --prod          # Deploy to Vercel

# Help & Info
npm run install:all           # Install all dependencies
vercel env list               # View Vercel environment variables
```

---

## PART 5: Environment Variables Explained

| Variable | Location | Purpose |
|----------|----------|---------|
| `REACT_APP_API_URL` | Frontend | Base URL for API calls (must start with `/api`) |
| `NODE_ENV` | Backend | `development` or `production` mode |
| `PORT` | Backend | Server port (3000 for frontend, 5000 for backend) |
| `FRONTEND_URL` | Backend | CORS origin - where frontend is hosted |
| `VERCEL_URL` | Auto | Auto-set by Vercel for CORS |

---

## ✅ Verification Checklist

- [ ] Local `.env` files created
- [ ] Dependencies installed (`npm run install:all`)
- [ ] Local dev works (`npm run dev`)
- [ ] Vercel project created & connected
- [ ] Environment variables set in Vercel
- [ ] Frontend deployed
- [ ] Backend deployed
- [ ] Environment variables updated with actual URLs
- [ ] Redeploy after env changes
- [ ] Browser console shows no errors
- [ ] API calls working (check Network tab)

---

## 📞 Still Need Help?

Check these files:
- [frontend/.env.local](../frontend/.env.local) - Frontend config
- [backend/.env](../backend/.env) - Backend config  
- [vercel.json](../vercel.json) - Vercel config
- [api/index.js](../api/index.js) - Serverless entry point

