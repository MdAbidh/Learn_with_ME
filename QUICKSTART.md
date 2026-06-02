# ⚡ Quick Start Guide - LERN_ME Learning Platform

## 🚀 30 Second Setup

### Windows - First Time Only

```bash
cd learning-platform
setup.bat
npm run dev
```

Done! Browser opens at http://localhost:3000

---

## 📋 What Gets Set Up

After running `setup.bat`:

```
✅ .env created with proper configuration
✅ backend/.env created  
✅ frontend/.env.local created
✅ All dependencies installed
✅ Ready to run!
```

---

## 🎯 Three Ways to Start

### Way 1: Everything Together (Easiest)
```bash
cd learning-platform
npm run dev
```
- Starts backend (5000) + frontend (3000)
- Auto-opens in browser
- Best for development

### Way 2: Separate Terminals (Best for Debugging)

**Terminal 1:**
```bash
cd learning-platform
npm run dev --prefix backend
# Wait for: 🚀 Learning Platform Backend running...
```

**Terminal 2:**
```bash
cd learning-platform
npm start --prefix frontend
# Wait for: You can now view learning-platform in the browser
```

### Way 3: Manual Setup (Custom Config)

```bash
# 1. Create these files manually
learning-platform\.env
learning-platform\backend\.env
learning-platform\frontend\.env.local

# 2. Copy content from SETUP_AND_DEPLOYMENT.md

# 3. Install
npm run install:all

# 4. Run
npm run dev
```

---

## ✅ It's Working When You See

### Browser Console (F12)
```
🔧 API Configuration:
   API URL: http://localhost:5000/api
   Environment: development
📤 API Request: GET /courses
📥 API Response: 200 /courses
```

### No Red Errors! ✅

---

## 🔧 Environment Variables Explained

| Variable | Where | What |
|----------|-------|------|
| `REACT_APP_API_URL` | Frontend | Where to find the API |
| `PORT` | Backend | Server port |
| `FRONTEND_URL` | Backend | For CORS security |
| `NODE_ENV` | Both | `development` or `production` |

**Default Values:**
```
REACT_APP_API_URL=http://localhost:5000/api
PORT=5000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

---

## 🐛 If You Get Errors

### Error: "Cannot GET /api/courses"
- Backend isn't running
- Fix: `npm run dev --prefix backend` in new terminal

### Error: "REACT_APP_API_URL is undefined"
- `.env` file not created or wrong location
- Fix: Run `setup.bat` again

### Error: "CORS error"
- Frontend and backend on different domains
- Fix: Check that `FRONTEND_URL` matches your domain

### Error: "Module not found"
- Dependencies not installed
- Fix: `npm run install:all`

👉 See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for more help

---

## 📱 Testing the App

1. **Open:** http://localhost:3000
2. **Console:** Press F12
3. **Import:** Click "Import Course"
4. **Choose:** Select a course folder with videos
5. **Watch:** Start watching!

---

## 🚀 Deploy to Vercel

After local testing works:

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy
vercel deploy --prod

# 3. Get your URL and update:
# REACT_APP_API_URL=https://YOUR-URL.vercel.app/api

# 4. Redeploy
vercel deploy --prod
```

Full guide: See [SETUP_AND_DEPLOYMENT.md](SETUP_AND_DEPLOYMENT.md)

---

## 📂 Project Structure

```
learning-platform/
├── .env                  ← Main environment config
├── backend/
│   ├── .env              ← Backend config
│   ├── src/
│   │   ├── index.js      ← Server entry point
│   │   ├── routes/       ← API routes
│   │   └── controllers/  ← Business logic
│   └── database/
│       └── schema.sql    ← Database setup
└── frontend/
    ├── .env.local        ← Frontend config (LOCAL ONLY)
    ├── src/
    │   ├── App.js        ← Main component
    │   ├── pages/        ← Pages
    │   └── utils/
    │       └── api.js    ← API client
    └── public/
        └── index.html
```

---

## 🎓 Learning Resources

- **Setup:** [SETUP_AND_DEPLOYMENT.md](SETUP_AND_DEPLOYMENT.md)
- **Bangla Guide:** [BANGLA_SETUP_GUIDE.md](BANGLA_SETUP_GUIDE.md)  
- **Troubleshooting:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Deployment Guide:** [VERCEL_DEPLOYMENT_GUIDE.md](VERCEL_DEPLOYMENT_GUIDE.md)

---

## 💡 Pro Tips

✅ Always check browser console (F12) first
✅ Network tab shows actual API calls
✅ Backend must start before frontend
✅ Environment variables need server restart
✅ Vercel changes need redeployment
✅ Clear cache if env vars don't update

---

## 🎯 Success Checklist

- [ ] Ran `setup.bat`
- [ ] `npm run dev` works
- [ ] Browser opens automatically
- [ ] No red errors in console
- [ ] Can import courses
- [ ] Can watch videos
- [ ] API calls show in Network tab

🎉 **Ready to learn!**

