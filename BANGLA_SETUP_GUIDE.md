# 🚀 Learning Platform - বাঙ্গালি সেটআপ গাইড

## ভাগ ১: লোকাল ডেভেলপমেন্ট সেটআপ

### Step 1: Environment Files তৈরি করুন

**Windows এ সহজ উপায়:**
```bash
cd learning-platform
setup.bat
```

**ম্যানুয়াল উপায়:**

এই ৩টি ফাইল তৈরি করুন:

#### ফাইল ১: `learning-platform/.env`
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

#### ফাইল ২: `learning-platform/frontend/.env.local`
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
```

#### ফাইল ৩: `learning-platform/backend/.env`
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Step 2: সব প্যাকেজ ইনস্টল করুন

```bash
cd learning-platform
npm run install:all
```

### Step 3: লোকাল সার্ভার চালান

```bash
npm run dev
```

এটি করবে:
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

### Step 4: টেস্ট করুন

1. ব্রাউজার খুলুন: http://localhost:3000
2. F12 দিয়ে Console খুলুন
3. কোন error থাকবে না ✅

---

## ভাগ ২: Vercel এ ডিপ্লয় করুন

### Step 1: Vercel এ Account তৈরি করুন

1. যান: https://vercel.com
2. Sign up / Login করুন
3. আপনার GitHub repository connect করুন

### Step 2: Environment Variables সেট করুন

**Vercel Dashboard এ যান:**
- Project Settings → Environment Variables

**এই Variables যোগ করুন:**

```
REACT_APP_API_URL = https://your-backend.vercel.app/api
FRONTEND_URL = https://your-frontend.vercel.app
NODE_ENV = production
```

### Step 3: ডিপ্লয় করুন

```bash
# Vercel CLI ইনস্টল করুন (এক বার)
npm install -g vercel

# লগইন করুন
vercel login

# ডিপ্লয় করুন
vercel deploy --prod
```

### Step 4: Environment Variables আপডেট করুন (গুরুত্বপূর্ণ!)

১. Vercel Dashboard খুলুন
২. আপনার Backend এর Domain কপি করুন (যা ডিপ্লয়ের পর দেখাবে)
৩. সেটিংস এ গিয়ে:

```
REACT_APP_API_URL = https://YOUR-BACKEND-DOMAIN.vercel.app/api
FRONTEND_URL = https://YOUR-FRONTEND-DOMAIN.vercel.app
```

৪. আবার ডিপ্লয় করুন:
```bash
vercel deploy --prod
```

---

## ভাগ ৩: সমস্যা সমাধান

### ❌ এখনও 404 error দেখাচ্ছে?

**চেক করুন ১: Environment Variables সঠিক?**
```bash
# Vercel Dashboard এ যান
# Settings → Environment Variables এ দেখুন

# REACT_APP_API_URL এ কী আছে?
# এটা হওয়া উচিত: https://YOUR-BACKEND.vercel.app/api
# NOT: http://localhost:5000/api
```

**চেক করুন ২: Redeploy করেছেন?**
```bash
# Environment variables পরিবর্তন করার পর:
vercel deploy --prod

# 2-3 মিনিট অপেক্ষা করুন
```

**চেক করুন ৩: Browser Cache Clear করুন**
- Ctrl+Shift+Delete
- সব Cache ডিলিট করুন
- Page রিলোড করুন

### ❌ API কল হচ্ছে না?

**Console খুলুন (F12) এবং এই কমান্ড চালান:**
```javascript
console.log(process.env.REACT_APP_API_URL)
```

এটা দেখাবে:
```
https://your-backend.vercel.app/api  ✅ ঠিক আছে
http://localhost:5000/api            ❌ সমস্যা আছে
```

যদি localhost দেখায়:
1. Environment file আছে কিনা চেক করুন
2. Redeploy করুন
3. Browser cache clear করুন

---

## ভাগ ৪: কমান্ড রেফারেন্স

```bash
# লোকাল ডেভেলপমেন্ট
npm run dev                    # Backend + Frontend উভয়

# Individual সার্ভার
npm run dev --prefix backend   # শুধু Backend
npm start --prefix frontend    # শুধু Frontend

# Vercel ডিপ্লয়
vercel deploy --prod          # সবকিছু ডিপ্লয় করুন

# সব ইনস্টল করুন
npm run install:all
```

---

## ✅ চেকলিস্ট

- [ ] `.env` ফাইল তৈরি করেছি
- [ ] `npm run install:all` চালিয়েছি
- [ ] লোকাল এ `npm run dev` কাজ করছে
- [ ] Vercel account তৈরি করেছি
- [ ] GitHub repository connected করেছি
- [ ] Environment variables সেট করেছি Vercel এ
- [ ] `vercel deploy --prod` চালিয়েছি
- [ ] Environment variables আপডেট করেছি আসল domains দিয়ে
- [ ] আবার ডিপ্লয় করেছি
- [ ] Browser console এ কোন error নেই

---

## 📝 মনে রাখবেন

1. **Environment variables পরিবর্তন করলে রিডিপ্লয় করতে হবে**
2. **Local dev এ `localhost:5000` ব্যবহার করুন**
3. **Vercel এ actual domain ব্যবহার করুন**
4. **প্রথমে Frontend ডিপ্লয় করুন, তারপর Backend**
5. **CORS error মানে domain গুলো match করছে না**

---

## 🎯 সফল হওয়ার সাইন

✅ http://localhost:3000 খুলছে (লোকাল এ)
✅ Browser console এ কোন red error নেই
✅ Data লোড হচ্ছে সঠিকভাবে
✅ Vercel এ ডোমেইন কাজ করছে
✅ Network tab এ API calls সফল হচ্ছে (Status: 200)

