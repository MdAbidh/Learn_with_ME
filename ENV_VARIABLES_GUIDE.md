# 📊 Environment Variables Flow Diagram

## How Environment Variables Work

```
┌─────────────────────────────────────────────────────────────────┐
│                      YOUR COMPUTER / SERVER                      │
└─────────────────────────────────────────────────────────────────┘

    LOCAL DEVELOPMENT
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    .env (Root)
    ├─ REACT_APP_API_URL=http://localhost:5000/api
    ├─ PORT=5000
    ├─ FRONTEND_URL=http://localhost:3000
    └─ NODE_ENV=development
          │
          ├─────────────────────┬─────────────────────┐
          ↓                     ↓                     ↓
    
    ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
    │   BACKEND        │  │   FRONTEND       │  │   BOTH           │
    │   (Node.js)      │  │   (React)        │  │                  │
    │                  │  │                  │  │ Uses from .env   │
    │ backend/.env     │  │ frontend/.env    │  │ and copies to:   │
    │ - PORT=5000      │  │ .local           │  │                  │
    │ - FRONTEND_URL   │  │ - API_URL        │  │ - backend/.env   │
    │                  │  │ - ENVIRONMENT    │  │ - frontend/.env  │
    │ Listens on:      │  │                  │  │                  │
    │ localhost:5000   │  │ Calls API from:  │  │                  │
    └────────┬─────────┘  │ localhost:5000   │  └──────────────────┘
             │            └────────┬─────────┘
             │                     │
             └─────────────┬───────┘
                           ↓
                    ✅ API Works!


    PRODUCTION (VERCEL)
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    Vercel Environment Variables (set in dashboard)
    ├─ REACT_APP_API_URL=https://backend-xyz.vercel.app/api
    ├─ FRONTEND_URL=https://frontend-xyz.vercel.app
    └─ NODE_ENV=production
          │
          ├──────────────────┬──────────────────┐
          ↓                  ↓                  ↓
    
    ┌──────────────────────┐  ┌──────────────────────┐
    │  FRONTEND            │  │  BACKEND API         │
    │  frontend-xyz.       │  │  backend-xyz.        │
    │  vercel.app          │  │  vercel.app/api      │
    │                      │  │                      │
    │  Uses env var:       │  │  Uses env var:       │
    │  REACT_APP_API_URL   │  │  FRONTEND_URL        │
    │  →                   │  │  (for CORS)          │
    │  backend-xyz.vercel. │  │                      │
    │  app/api             │  │                      │
    │                      │  │                      │
    │  Makes API calls ────┼─→ Responds with data   │
    └──────────────────────┘  └──────────────────────┘
```

---

## File Location Reference

```
learning-platform/
│
├── 📄 .env  ← ROOT ENV FILE
│   ├─ REACT_APP_API_URL (for frontend)
│   ├─ PORT (for backend)
│   ├─ FRONTEND_URL (for backend CORS)
│   └─ NODE_ENV (development/production)
│
├── backend/
│   ├── 📄 .env  ← BACKEND ENV FILE
│   │   ├─ PORT
│   │   ├─ NODE_ENV
│   │   └─ FRONTEND_URL
│   └── src/
│       └── index.js  (reads PORT, FRONTEND_URL, NODE_ENV)
│
└── frontend/
    ├── 📄 .env.local  ← FRONTEND ENV FILE (LOCAL ONLY)
    │   ├─ REACT_APP_API_URL
    │   └─ REACT_APP_ENV
    └── src/
        └── utils/
            └── api.js  (reads REACT_APP_API_URL)
```

---

## Variable Flow Explanation

### 1. Local Development

```
You run: npm run dev

┌─ root/.env loaded
│  ├─ Passed to backend process (PORT, FRONTEND_URL, NODE_ENV)
│  └─ Passed to frontend process (REACT_APP_API_URL, REACT_APP_ENV)
│
├─ backend/.env also loaded (for redundancy)
│
├─ frontend/.env.local also loaded
│
└─ Both services start with correct config
```

### 2. Vercel Deployment

```
You run: vercel deploy --prod

┌─ Vercel reads from Dashboard Settings
│  └─ Environment Variables section
│
├─ Builds frontend with REACT_APP_API_URL
│  └─ Embeds it into JavaScript bundle
│
├─ Builds backend with FRONTEND_URL, PORT
│  └─ Used for CORS and server setup
│
└─ Deploys both with environment variables
```

---

## Which File to Edit?

### ✅ For Local Development
Edit these:
```
learning-platform/.env
learning-platform/backend/.env
learning-platform/frontend/.env.local
```

### ✅ For Vercel Production
Edit these in Vercel Dashboard:
- Project Settings
- Environment Variables
- Add: REACT_APP_API_URL, FRONTEND_URL, NODE_ENV

### ❌ DON'T edit
- `.env` in git commits (it's in .gitignore)
- Frontend .env during build (use REACT_APP_* prefix)
- Backend .env in production (use Vercel dashboard)

---

## Environment Variable Prefixes

### REACT_APP_* (Frontend Only)
These are embedded in the frontend JavaScript:
```javascript
// This works:
process.env.REACT_APP_API_URL  ✅

// This doesn't work in frontend:
process.env.PORT               ❌
process.env.FRONTEND_URL       ❌
```

### Backend (No Prefix)
These are used server-side:
```javascript
// This works:
process.env.PORT               ✅
process.env.FRONTEND_URL       ✅
process.env.NODE_ENV           ✅

// Frontend can't access these:
process.env.BACKEND_SECRET     ❌
```

---

## Setting Environment Variables - Quick Reference

### Local Development (Windows)

**Option 1: setup.bat (Automatic)**
```bash
cd learning-platform
setup.bat
```

**Option 2: Manual (notepad)**
1. Right-click → New Text Document
2. Name it `.env`
3. Add content (see SETUP_AND_DEPLOYMENT.md)
4. Save in `learning-platform/` folder

**Option 3: PowerShell**
```powershell
$env:REACT_APP_API_URL = "http://localhost:5000/api"
$env:PORT = "5000"
npm run dev
```

### Vercel Production

1. Dashboard: https://vercel.com/dashboard
2. Select Project
3. Settings → Environment Variables
4. Click "Add New"
5. Fill in name and value
6. Select Production
7. Click Add
8. Redeploy: `vercel deploy --prod`

---

## Debugging: Which Value Is Being Used?

### Check Frontend
```javascript
// Open browser console (F12)
console.log(process.env.REACT_APP_API_URL)
```

### Check Backend
```bash
# Add this to index.js:
console.log('API URL:', process.env.REACT_APP_API_URL)
console.log('Port:', process.env.PORT)
console.log('Frontend URL:', process.env.FRONTEND_URL)
console.log('Node Env:', process.env.NODE_ENV)

# Run backend and check console output
npm run dev --prefix backend
```

### Check What Vercel Knows
```bash
vercel env list
```

---

## Common Mistakes

❌ **Using wrong prefix**
```javascript
// Wrong (frontend):
process.env.PORT  // undefined

// Right (frontend):
process.env.REACT_APP_API_URL  // works
```

❌ **Not restarting after env change**
```bash
# ❌ Won't work:
# 1. Change .env file
# 2. Keep running npm run dev
# 3. Still uses old values

# ✅ Do this:
# 1. Change .env file
# 2. Stop npm run dev (Ctrl+C)
# 3. Run npm run dev again
# 4. Now uses new values
```

❌ **Using localhost in Vercel**
```bash
# ❌ Wrong:
REACT_APP_API_URL = http://localhost:5000/api

# ✅ Right:
REACT_APP_API_URL = https://backend-xyz.vercel.app/api
```

❌ **Forgetting REACT_APP_ prefix**
```javascript
// ❌ Wrong (won't be available in frontend):
API_URL = "http://localhost:5000/api"

// ✅ Right:
REACT_APP_API_URL = "http://localhost:5000/api"
```

---

## Testing Your Environment

```bash
# Test backend can read env:
npm run dev --prefix backend
# Should print: 🚀 Learning Platform Backend running on http://localhost:5000

# Test frontend can read env:
npm start --prefix frontend
# Open F12, should show: API URL: http://localhost:5000/api

# Test API works:
# In browser console:
fetch('/api/courses').then(r => r.json()).then(d => console.log(d))
```

---

## Summary

| Phase | Where | How | Env Variables |
|-------|-------|-----|---|
| Local Dev | Your Computer | `.env` files | REACT_APP_API_URL, PORT, FRONTEND_URL |
| Build | Your Computer | npm run build | Reads .env, embeds values |
| Vercel Deploy | Cloud | Dashboard UI | Set in Vercel UI |
| Runtime | Cloud | Vercel Servers | Used by deployed app |

