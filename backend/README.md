# CloneLM Backend - Render Deployment

This is the backend API for the Google NotebookLM Clone, designed to be deployed on Render.

## 🚀 Quick Deploy on Render

### 1. Create New Web Service
- **Source**: Connect to your GitHub repository
- **Root Directory**: Leave empty (use root directory)
- **Language**: Node
- **Branch**: `main`

### 2. Build & Start Commands
- **Build Command**: `npm run install:backend`
- **Start Command**: `npm start`

### 3. Environment Variables
Add these in Render dashboard:
```env
GOOGLE_API_KEY=AIzaSyCmOI4xD4M4UoCw89-GBQzaJ9WhvxouX4Y
NODE_ENV=production
PORT=10000
```

## 📡 API Endpoints

### File Operations
- `POST /api/upload` - Upload PDF files
- `GET /api/files` - List uploaded files
- `POST /api/process-pdf/:filename` - Process PDF for AI

### AI Interaction
- `POST /api/ask` - Ask questions about documents
- `GET /api/summary/:filename` - Get document summary
- `GET /api/processed-documents` - List processed docs

### System Management
- `DELETE /api/document/:filename` - Delete documents
- `GET /api/health` - Health check

## 🔧 Local Development

```bash
# From root directory
npm run dev

# Or from backend directory
cd backend
npm run dev
```

Server will run on `http://localhost:8080`

## 🌐 Production URL

After deployment, your API will be available at:
```
https://your-app-name.onrender.com/api/*
```

## 📝 Notes

- Free Render instances spin down after inactivity
- First request after spin-down may take 30-60 seconds
- File uploads are stored temporarily (not persistent on free tier)
- Consider upgrading to paid tier for production use

## 🔧 Alternative Start Commands

If `npm start` doesn't work, try:
- `npm run render-start`
- `cd backend && node server.js`
- `cd backend && npm start`
