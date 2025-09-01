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

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (version 18 or higher)
- **npm** or **yarn** package manager
- **Google AI API Key** (Gemini API access)

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd notebooklm-clone
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

```env
PORT=8080
GOOGLE_API_KEY=your_google_api_key_here
NODE_ENV=development
UPLOAD_DIR=uploads
MAX_FILE_SIZE=52428800
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

## 🚀 Running the Application

### Development Mode

1. **Start the Backend Server:**
```bash
cd backend
npm run dev
```
The backend will run on `http://localhost:8080`

2. **Start the Frontend Server:**
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173`

### Production Build

1. **Build the Frontend:**
```bash
cd frontend
npm run build
```

2. **Start the Backend:**
```bash
cd backend
npm start
```

## 📖 Usage Guide

### 1. Upload a PDF Document
- Click on the **"Upload"** tab
- Drag and drop your PDF file or click to browse
- Wait for the document to be processed (this may take a few minutes for large files)

### 2. Chat with Your Document
- Switch to the **"Chat"** tab
- Ask questions in natural language about your document
- View AI-generated responses with source citations

### 3. Navigate Citations
- Click on any citation button in chat responses
- The PDF viewer will open/navigate to the referenced page
- View the source context directly in the document

### 4. PDF Viewer Controls
- **Zoom**: Use zoom in/out buttons or scroll
- **Navigation**: Use arrow buttons or page input
- **Rotation**: Rotate the document view
- **Download**: Download the original PDF file

## 🔍 API Endpoints

### Backend API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/upload` | Upload PDF file |
| `POST` | `/api/process-pdf/:filename` | Process uploaded PDF |
| `POST` | `/api/ask` | Ask question about document |
| `GET` | `/api/summary/:filename` | Get document summary |
| `GET` | `/api/processed-documents` | List processed documents |
| `DELETE` | `/api/document/:filename` | Delete document |

### Request Examples

**Upload PDF:**
```bash
curl -X POST -F "pdf=@document.pdf" http://localhost:8080/api/upload
```

**Ask Question:**
```bash
curl -X POST http://localhost:8080/api/ask \
  -H "Content-Type: application/json" \
  -d '{"filename": "document.pdf", "question": "What is the main topic?"}'
```

## 🏗️ Architecture

### Frontend Architecture
```
src/
├── components/
│   ├── FileUpload.tsx      # PDF upload component
│   ├── ChatInterface.tsx   # Chat with citations
│   ├── PDFViewer.tsx       # PDF viewing component
│   └── DocumentList.tsx    # Document management
├── types.ts                # TypeScript type definitions
└── App.tsx                 # Main application component
```

### Backend Architecture
```
backend/
├── server.js               # Express server setup
├── aiProcessor.js          # Langchain & Gemini integration
├── uploads/                # Uploaded PDF files
├── package.json
└── .env                    # Environment configuration
```

### Data Flow
1. **Upload**: PDF → Server → File Storage
2. **Processing**: PDF → Text Extraction → Chunking → Vectorization
3. **Query**: Question → Semantic Search → AI Generation → Response + Citations
4. **Display**: Response → Chat UI → Citation Navigation → PDF Viewer

## 🔐 Security Considerations

- **File Validation**: Only PDF files accepted with size limits
- **API Key Protection**: Store API keys securely in environment variables
- **CORS Configuration**: Proper CORS setup for cross-origin requests
- **Input Sanitization**: Validate and sanitize all user inputs

## 🚀 Deployment

### Free Hosting Options

#### Frontend (Netlify)
1. Build the frontend: `npm run build`
2. Upload the `dist/` folder to Netlify
3. Configure build settings if needed

#### Backend (Render)
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables

#### Backend (Railway)
1. Connect your GitHub repository
2. Railway auto-detects Node.js projects
3. Add environment variables
4. Deploy automatically

### Environment Variables for Production
```env
PORT=8080
GOOGLE_API_KEY=your_production_api_key
NODE_ENV=production
UPLOAD_DIR=uploads
MAX_FILE_SIZE=52428800
```

## 🐛 Troubleshooting

### Common Issues

**Backend won't start:**
- Check if port 8080 is available
- Verify Google API key is valid
- Ensure all dependencies are installed

**Frontend build fails:**
- Clear node_modules and reinstall
- Check Node.js version compatibility
- Verify all TypeScript types are correct

**PDF processing fails:**
- Check file size (max 50MB)
- Ensure PDF is not password-protected
- Verify Google API quota/limits

**CORS errors:**
- Backend and frontend must run on different ports
- CORS is configured for localhost origins

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=*
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for powerful language models
- **Langchain** for AI orchestration framework
- **React & Vite** for modern frontend development
- **Tailwind CSS** for beautiful UI components

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Review the API documentation
3. Open an issue on GitHub
4. Contact the development team

---

**Happy Document Chatting! 📄🤖**
