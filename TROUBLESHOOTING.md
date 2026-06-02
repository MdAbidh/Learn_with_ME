# 🔍 Troubleshooting Guide - 404 Error Solution

## Quick Fixes

### Fix 1: Check if Backend is Running

**Windows - PowerShell:**
```powershell
# Check if port 5000 is in use
netstat -ano | findstr :5000

# If yes, backend is running ✅
# If no, start it with:
npm run dev --prefix backend
```

**Mac/Linux:**
```bash
# Check if port 5000 is in use
lsof -i :5000

# If nothing shows, backend is not running
# Start with:
npm run dev --prefix backend
```

---

### Fix 2: Verify Environment Variables

**Check Frontend Environment:**
```javascript
// Open browser console (F12) and run:
console.log('API URL:', process.env.REACT_APP_API_URL)
console.log('Node Env:', process.env.NODE_ENV)

// Should show:
// API URL: http://localhost:5000/api (local)
// API URL: https://your-backend.vercel.app/api (production)
```

**Check if files exist:**
```bash
# Windows
dir learning-platform\frontend\.env.local
dir learning-platform\backend\.env
dir learning-platform\.env

# Mac/Linux
ls -la learning-platform/frontend/.env.local
ls -la learning-platform/backend/.env
ls -la learning-platform/.env
```

---

### Fix 3: Test API Directly

**Using Browser Developer Tools:**
```javascript
// F12 → Console → Paste this:
fetch('http://localhost:5000/api/courses')
  .then(r => r.json())
  .then(d => console.log('✅ API Works:', d))
  .catch(e => console.error('❌ API Error:', e))
```

**Using PowerShell:**
```powershell
# Test if backend is responding
Invoke-WebRequest http://localhost:5000/health

# Should return: {"status":"ok","timestamp":"..."}
```

**Using Terminal:**
```bash
curl http://localhost:5000/health
```

---

### Fix 4: CORS Issues

**If you see CORS error:**
- ✅ This is NORMAL between different domains
- ✅ Backend is configured to handle it

**Local development:**
- Backend should allow: http://localhost:3000
- Check: `backend/src/index.js` line 12-18

**Vercel production:**
- Backend should allow: your-frontend.vercel.app
- Check env variables are set

---

### Fix 5: Clear Everything and Restart

```bash
# Stop all servers (Ctrl+C in terminal)

# Remove node_modules and cache
rmdir /s node_modules
rmdir /s learning-platform\backend\node_modules
rmdir /s learning-platform\frontend\node_modules
del package-lock.json

# Fresh install
npm run install:all

# Verify env files exist
# (Check step Fix 3 above)

# Start fresh
npm run dev
```

---

## Diagnostic Checklist

Run through these in order:

### 1️⃣ Environment Files
```bash
# All these should exist and have content:
learning-platform\.env                 ← Main env file
learning-platform\backend\.env         ← Backend config
learning-platform\frontend\.env.local  ← Frontend config
```

### 2️⃣ Dependencies Installed
```bash
# These should exist:
learning-platform\node_modules
learning-platform\backend\node_modules
learning-platform\frontend\node_modules
```

### 3️⃣ Backend Running
```powershell
# Run this in new terminal:
npm run dev --prefix backend

# Should show:
# 🚀 Learning Platform Backend running on http://localhost:5000
# 📚 API available at http://localhost:5000/api
```

### 4️⃣ Frontend Running
```powershell
# Run in another terminal:
npm start --prefix frontend

# Should show:
# webpack compiled successfully
# Compiled successfully!
# You can now view learning-platform in the browser
```

### 5️⃣ Test API Call
```javascript
// In browser console (F12):
fetch('/api/courses')
  .then(r => r.json())
  .then(d => console.log('Works:', d))
  .catch(e => console.error('Error:', e))

// Should work without CORS errors
```

### 6️⃣ Vercel Deployment
```bash
# Deploy
vercel deploy --prod

# Check env vars
vercel env list

# Should show:
# REACT_APP_API_URL = https://...vercel.app/api
# FRONTEND_URL = https://...vercel.app
```

---

## Common Error Messages & Solutions

### ❌ "Cannot GET /api/courses"
**Meaning:** Backend isn't running
**Fix:** Start backend with `npm run dev --prefix backend`

### ❌ "CORS error: Access-Control-Allow-Origin"
**Meaning:** Frontend and backend domains don't match in CORS
**Fix:** Check environment variables - they must match exactly

### ❌ "GET http://localhost:5000/api/courses 404"
**Meaning:** Frontend can't reach backend server
**Fix:** 
- Make sure backend is running on port 5000
- Check REACT_APP_API_URL in console

### ❌ "Timeout on /api/courses"
**Meaning:** Request takes too long
**Fix:** 
- Backend may be slow
- Check console for errors
- Restart backend: `npm run dev --prefix backend`

### ❌ "Network Error"
**Meaning:** Can't reach the server at all
**Fix:**
- Is backend running? Check with `netstat -ano | findstr :5000`
- Is frontend on correct URL?
- Check REACT_APP_API_URL

---

## Debug Mode

### Enable Full Logging

**Step 1:** Edit `frontend/src/utils/api.js`
```javascript
// Change development check to:
if (true) {  // Force logging even in production
  console.log('🔧 API Configuration...');
}
```

**Step 2:** Restart frontend and check console

**Step 3:** Watch Network tab (F12 → Network)
- Click API calls to see full request/response
- Check Response tab for error message

---

## Still Not Working?

1. **Paste your error message** in a GitHub issue
2. **Attach screenshot** of browser console error
3. **Check Network tab** - what's the actual URL being called?
4. **Run diagnostic:**
```powershell
# List what's running on port 5000
netstat -ano | findstr :5000

# List what's running on port 3000
netstat -ano | findstr :3000
```

5. **Check file contents:**
```bash
# Show what's in your env files
type learning-platform\.env
type learning-platform\frontend\.env.local
type learning-platform\backend\.env
```

---

## Prevention Tips

✅ Always check console for errors FIRST
✅ Network tab shows actual URL being called
✅ Backend must run before frontend
✅ Environment variables don't reload without server restart
✅ Vercel env vars need redeployment to take effect
✅ Browser cache can prevent env var changes - clear it!

