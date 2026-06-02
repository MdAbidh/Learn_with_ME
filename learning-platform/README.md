# 🎓 LearnHub — Personal Learning Platform

A complete offline Udemy-style course management system. Import local video folders and turn them into structured courses with progress tracking, notes, bookmarks, analytics, and certificates.

## ✨ Features

- **📁 Course Import** — Import any folder of videos; subfolders become modules, videos become lessons
- **▶ Video Player** — Full-featured player with keyboard shortcuts, PiP, theater mode, resume playback
- **📊 Progress Tracking** — Sequential learning with 90% completion threshold
- **📝 Notes** — Timestamped notes per lesson, searchable
- **🔖 Bookmarks** — Save and jump to important moments
- **📈 Analytics** — Watch time, streaks, heatmap calendar
- **🔍 Global Search** — Search courses, lessons, notes, bookmarks
- **🏆 Certificates** — Auto-generated SVG certificates on course completion
- **💾 Backup/Restore** — Export/import all data as JSON
- **🌙 Dark/Light Mode** — Full theme support

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### Install & Run

```bash
# 1. Install all dependencies
cd "d:\recorded\hello moto\learning-platform"
npm run install:all

# 2. Start development (backend + frontend)
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

### Import Your First Course

1. Click **"Import Course Folder"** in the sidebar
2. Enter the full path to your course folder
   - Example: `C:\Courses\Java Masterclass`
   - Example: `D:\Videos\Python Bootcamp`
3. The platform automatically scans and organizes everything

## 📁 Supported Formats

**Video:** mp4, mkv, avi, mov, webm, m4v, flv  
**Resources:** pdf, ppt, pptx, doc, docx, xls, xlsx, zip, rar, 7z, txt, md

## ⌨️ Keyboard Shortcuts (Player)

| Key | Action |
|-----|--------|
| Space | Play / Pause |
| ← | Back 10 seconds |
| → | Forward 10 seconds |
| F | Fullscreen |
| M | Mute |
| N | Next lesson |

## 🗂️ Project Structure

```
learning-platform/
├── backend/          # Express.js API + SQLite
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/   # Course scanner, thumbnail generator
│   │   └── utils/      # Database, natural sort
│   └── database/       # SQLite schema
├── frontend/         # React.js app
│   └── src/
│       ├── pages/      # Dashboard, Courses, Player, Analytics...
│       ├── components/ # Layout, UI components
│       └── store/      # Redux slices
├── electron/         # Desktop app wrapper
├── uploads/          # Thumbnails, certificates
└── backups/          # Exported backups
```

## 🔒 Privacy

- **100% offline** — no internet required after setup
- **No data upload** — everything stays on your device
- **Local SQLite** — database stored at `backend/database/learning_platform.db`
