#!/bin/bash

# Learning Platform - Complete Setup Guide
# ============================================

echo "🚀 Setting up Learning Platform..."

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm install
npm install --prefix backend
npm install --prefix frontend

# Step 2: Create environment files
echo "📝 Creating environment files..."

# Frontend .env.local
cat > learning-platform/frontend/.env.local << 'EOF'
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
EOF

# Backend .env
cat > learning-platform/backend/.env << 'EOF'
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
EOF

# Root .env
cat > learning-platform/.env << 'EOF'
# Frontend
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development

# Backend  
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
EOF

echo "✅ Environment files created!"
echo ""
echo "📋 Environment Configuration:"
echo "================================"
echo "Frontend API URL: http://localhost:5000/api"
echo "Backend Port: 5000"
echo "Frontend Port: 3000"
echo ""
echo "🎉 Setup complete! Run: npm run dev"
