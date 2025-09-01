# Google NotebookLM Clone

A web-based application that enables users to upload and interact with PDF documents through a chat interface, powered by AI for efficient information extraction.

## 🚀 Features

### PDF Upload and Viewing
- **Large PDF Support**: Upload PDF files up to 50MB
- **Integrated PDF Viewer**: Navigate through uploaded documents with zoom, rotation, and page controls
- **File Validation**: Automatic validation of PDF format and size limits

### AI-Powered Chat Interface
- **Natural Language Queries**: Ask questions about your PDF content in plain English
- **Intelligent Responses**: Get AI-generated answers based on document content
- **Real-time Processing**: Instant responses with minimal token usage

### Citation & Navigation
- **Source Citations**: Each response includes clickable citations referencing specific pages
- **PDF Navigation**: Click citations to jump to relevant pages in the PDF viewer
- **Context Preservation**: Maintains conversation history and context

### Performance Optimizations
- **Vectorization**: Efficient document processing using Langchain and Gemini AI
- **Chunking Strategy**: Smart text splitting for optimal retrieval
- **Memory Management**: Optimized memory usage for large documents

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for responsive styling
- **Lucide React** for modern icons
- **Axios** for HTTP requests

### Backend
- **Node.js** with Express.js
- **Langchain** for AI orchestration
- **Google Gemini AI** for natural language processing
- **Multer** for file uploads
- **Memory Vector Store** for document embeddings

### AI/ML
- **Google Gemini 1.5 Flash** model
- **PDF text extraction** and processing
- **Semantic search** and retrieval
- **Citation generation** with page references

## 🚀 Deployment

### Vercel (Recommended)
This application is configured for **Vercel deployment** with both frontend and backend hosted on the same platform.

#### Frontend
- **Framework**: Vite + React
- **Build Output**: `frontend/dist/`
- **Static Hosting**: Automatically served by Vercel

#### Backend
- **Runtime**: Node.js 18.x
- **Serverless Functions**: All API endpoints (`/api/*`)
- **File Storage**: Temporary storage (resets on function cold start)

#### Environment Variables
Set these in your Vercel project:
```env
GOOGLE_API_KEY=your_google_api_key_here
NODE_ENV=production
```

### Alternative Deployments

#### Frontend Only (Netlify/Vercel)
1. Build the frontend: `npm run build`
2. Deploy the `dist/` folder
3. Configure API base URL to point to your backend

#### Backend Only (Railway/Render)
1. Deploy the `backend/` folder
2. Set environment variables
3. Update frontend API calls to point to your backend URL

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (version 18 or higher)
- **npm** or **yarn** package manager
- **Google AI API Key** (Gemini API access)

## 🔧 Local Development

### 1. Clone the Repository
```bash
git clone <repository-url>
cd notebooklm-clone
```

### 2. Install Dependencies
```bash
npm run install:all
```

### 3. Set Environment Variables
Create `.env` file in the backend directory:
```env
PORT=8080
GOOGLE_API_KEY=your_google_api_key_here
NODE_ENV=development
UPLOAD_DIR=uploads
MAX_FILE_SIZE=52428800
```

### 4. Start Development Servers
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:frontend  # Frontend on http://localhost:5173
npm run dev:backend   # Backend on http://localhost:8080
```

## 🏗️ Architecture

### Vercel Deployment
```
Frontend (Static) → Vercel Edge Network
       ↓
Backend (Serverless) → Vercel Functions
       ↓
AI Processing → Google Gemini API
```

### Local Development
```
Frontend (Vite) → Proxy → Backend (Express)
       ↓
Backend → AI Processing → Google Gemini API
```

## 🔐 Security Considerations

- **API Key Protection**: Store API keys securely in Vercel environment variables
- **File Validation**: Only PDF files accepted with size limits
- **CORS Configuration**: Proper CORS setup for cross-origin requests
- **Input Sanitization**: Validate and sanitize all user inputs

## 🚀 Production Deployment

### Vercel (Automatic)
1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Set Environment Variables**: Add `GOOGLE_API_KEY` in Vercel dashboard
3. **Deploy**: Vercel automatically builds and deploys on every push

### Manual Deployment
1. **Build Frontend**: `npm run build`
2. **Deploy Backend**: Upload backend folder to your hosting provider
3. **Configure**: Set environment variables and update API endpoints

## 📞 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the API documentation
3. Open an issue on GitHub
4. Contact the development team

---

**Happy Document Chatting! 📄🤖**

## 🌐 Live Demo

**Coming Soon**: This application will be deployed on Vercel with both frontend and backend hosted on the same platform for seamless integration.
