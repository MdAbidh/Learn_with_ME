# 🚀 Copy-Paste Commands Guide

## 1️⃣ INITIAL SETUP (One Time Only)

### Windows PowerShell

```powershell
# Navigate to project
cd learning-platform

# Run automatic setup (creates all .env files and installs packages)
.\setup.bat

# Wait for it to complete... (takes 2-3 minutes)
```

### Mac/Linux Terminal

```bash
# Navigate to project
cd learning-platform

# Run automatic setup
bash setup.sh

# Wait for it to complete... (takes 2-3 minutes)
```

---

## 2️⃣ DAILY DEVELOPMENT

### Start Everything (Easiest)

```bash
cd learning-platform
npm run dev
```

Browser will open at: **http://localhost:3000**

---

## 3️⃣ DEBUGGING (If Something Goes Wrong)

### Test Backend is Running

**Windows:**
```powershell
# Check if port 5000 has something running
netstat -ano | findstr :5000

# If you see output, backend is running ✅
# If nothing, run: npm run dev --prefix backend
```

**Mac/Linux:**
```bash
# Check if port 5000 has something running
lsof -i :5000

# If nothing shows, backend not running
# Fix: npm run dev --prefix backend
```

### Test API Works

**PowerShell:**
```powershell
# Test backend health
Invoke-WebRequest http://localhost:5000/health

# Should show: {"status":"ok","timestamp":"..."}
```

**Terminal:**
```bash
curl http://localhost:5000/health

# Should show: {"status":"ok","timestamp":"..."}
```

### Check Environment Variables

**In Browser Console (F12):**
```javascript
// Copy-paste this:
console.log('API URL:', process.env.REACT_APP_API_URL)
console.log('Env:', process.env.NODE_ENV)
```

Should show something like:
```
API URL: http://localhost:5000/api
Env: development
```

### Test API Connection

**In Browser Console (F12):**
```javascript
// Copy-paste this:
fetch('/api/courses')
  .then(r => r.json())
  .then(d => console.log('✅ Works!', d))
  .catch(e => console.error('❌ Error:', e))
```

Should NOT show errors. If it works, you'll see data!

---

## 4️⃣ DEPLOYMENT TO VERCEL

### Step 1: Login to Vercel

```bash
# Install Vercel CLI (first time only)
npm install -g vercel

# Login
vercel login
```

### Step 2: Deploy

```bash
# From project root
cd learning-platform

# Deploy to Vercel
vercel deploy --prod
```

**Copy the URL it shows!** E.g.: `https://learning-platform-xyz.vercel.app`

### Step 3: View Environment Variables

```bash
# See what Vercel knows
vercel env list
```

### Step 4: Set Environment Variables

**Option A: Command Line**
```bash
# Set backend API URL
vercel env add REACT_APP_API_URL https://your-backend-domain.vercel.app/api

# Set frontend URL
vercel env add FRONTEND_URL https://your-frontend-domain.vercel.app

# Set production mode
vercel env add NODE_ENV production
```

**Option B: Dashboard (Recommended)**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add:
   - Name: `REACT_APP_API_URL`
   - Value: `https://your-backend.vercel.app/api`
5. Click Add
6. Repeat for other variables

### Step 5: Redeploy

```bash
vercel deploy --prod
```

---

## 5️⃣ INDIVIDUAL SERVER COMMANDS

### Start Just Backend

```bash
npm run dev --prefix backend

# Should show:
# 🚀 Learning Platform Backend running on http://localhost:5000
# 📚 API available at http://localhost:5000/api
```

### Start Just Frontend

```bash
npm start --prefix frontend

# Should show:
# webpack compiled successfully
# You can now view learning-platform in the browser.
```

### Build Frontend

```bash
npm run build --prefix frontend

# Creates: frontend/build/
```

---

## 6️⃣ CLEAN REINSTALL

If something breaks, do a clean reinstall:

```bash
# Delete everything
rmdir /s node_modules
rmdir /s backend\node_modules
rmdir /s frontend\node_modules
del package-lock.json

# Fresh install
npm run install:all

# Run setup again
.\setup.bat

# Start fresh
npm run dev
```

---

## 7️⃣ USEFUL SHORTCUT COMMANDS

### Added to package.json

```bash
# Test API health
npm run test:health

# Test API courses endpoint
npm run test:api

# Start just backend
npm run dev:backend

# Start just frontend  
npm run dev:frontend

# Build everything
npm run build:full
```

---

## 8️⃣ CHECKING EVERYTHING IS WORKING

### Quick Checklist

```bash
# 1. Check .env files exist
dir learning-platform\.env
dir learning-platform\frontend\.env.local
dir learning-platform\backend\.env

# 2. Check node_modules exist
dir node_modules
dir backend\node_modules
dir frontend\node_modules

# 3. Start development
npm run dev

# 4. When browser opens, check F12 console
# Should show: 🔧 API Configuration...
# Should NOT show red errors

# 5. Test API call in console (F12):
fetch('/api/courses').then(r => r.json()).then(d => console.log(d))

# 6. If it works, you're done! ✅
```

---

## 9️⃣ IF YOU GET ERRORS

### Error: "ENOENT: no such file or directory"
```bash
npm run install:all
npm run dev
```

### Error: "Cannot find module 'express'"
```bash
npm run install:all
```

### Error: "CORS error"
```bash
# Check your .env file has the right values
type learning-platform\.env

# Should have:
# REACT_APP_API_URL=http://localhost:5000/api
# FRONTEND_URL=http://localhost:3000
# NODE_ENV=development
```

### Error: "Port 5000 already in use"
```powershell
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill it (replace PID with actual number)
taskkill /PID <PID> /F

# Then try again
npm run dev
```

### Error: "Port 3000 already in use"
```powershell
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill it (replace PID with actual number)
taskkill /PID <PID> /F

# Then try again
npm run dev
```

---

## 🔟 QUICK REFERENCE

```
LOCAL DEVELOPMENT:
├─ Initial Setup: cd learning-platform && .\setup.bat
├─ Daily Start: npm run dev
├─ Backend Only: npm run dev --prefix backend
├─ Frontend Only: npm start --prefix frontend
└─ Test: F12 → fetch('/api/courses').then(...)

DEPLOYMENT:
├─ First Time: vercel login && vercel deploy --prod
├─ Set Vars: vercel env add REACT_APP_API_URL https://...
├─ Check Vars: vercel env list
└─ Redeploy: vercel deploy --prod

DEBUGGING:
├─ Check Backend: netstat -ano | findstr :5000
├─ Check API: curl http://localhost:5000/health
├─ Check Env: F12 → console.log(process.env.REACT_APP_API_URL)
└─ Check Data: F12 → fetch('/api/courses').then(r => r.json()).then(console.log)

CLEAN:
└─ Full Reset: rmdir /s node_modules && npm run install:all && npm run dev
```

---

## Most Common Workflow

```
Day 1:
  cd learning-platform
  .\setup.bat
  ← Wait for completion
  npm run dev
  ← Browser opens
  ← Test everything works
  
Day 2+:
  cd learning-platform
  npm run dev
  ← Keep working!
  
When Ready to Deploy:
  vercel login
  vercel deploy --prod
  ← Copy domain
  vercel env add REACT_APP_API_URL https://...
  vercel env add FRONTEND_URL https://...
  vercel deploy --prod
  ← Done! ✅
```

---

## 📞 Still Need Help?

1. Check browser console: **F12**
2. Check error message carefully
3. Try: **npm run dev** again
4. Check: **setup.bat** ran successfully
5. Read: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
6. Check: [SOLUTION_SUMMARY.md](SOLUTION_SUMMARY.md)

