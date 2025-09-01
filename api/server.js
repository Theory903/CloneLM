require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const aiProcessor = require('./aiProcessor');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Routes
app.post('/api/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      path: req.file.path,
      uploadTime: new Date().toISOString()
    };

    res.json({
      message: 'File uploaded successfully',
      file: fileInfo
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

app.get('/api/files', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir)
      .filter(file => file.endsWith('.pdf'))
      .map(filename => {
        const filePath = path.join(uploadsDir, filename);
        const stats = fs.statSync(filePath);
        return {
          filename,
          size: stats.size,
          uploadTime: stats.mtime,
          path: filePath
        };
      });

    res.json({ files });
  } catch (error) {
    console.error('Error reading files:', error);
    res.status(500).json({ error: 'Failed to read files' });
  }
});

// Process uploaded PDF
app.post('/api/process-pdf/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const result = await aiProcessor.processPDF(filePath, filename);
    res.json(result);
  } catch (error) {
    console.error('Process PDF error:', error);
    res.status(500).json({ error: 'Failed to process PDF' });
  }
});

// Ask question about processed PDF
app.post('/api/ask', async (req, res) => {
  try {
    const { filename, question } = req.body;

    if (!filename || !question) {
      return res.status(400).json({ error: 'Filename and question are required' });
    }

    const result = await aiProcessor.askQuestion(filename, question);
    res.json(result);
  } catch (error) {
    console.error('Ask question error:', error);
    res.status(500).json({ error: 'Failed to process question' });
  }
});

// Get document summary
app.get('/api/summary/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const result = await aiProcessor.getDocumentSummary(filename);
    res.json(result);
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ error: 'Failed to get summary' });
  }
});

// Get processed documents
app.get('/api/processed-documents', (req, res) => {
  try {
    const documents = aiProcessor.getProcessedDocuments();
    res.json({ documents });
  } catch (error) {
    console.error('Get processed documents error:', error);
    res.status(500).json({ error: 'Failed to get processed documents' });
  }
});

// Delete document and clean up
app.delete('/api/document/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);

    // Remove from file system
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove from AI processor
    aiProcessor.removeDocument(filename);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Vercel serverless function export
module.exports = app;

// Only start server if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Google API Key configured: ${process.env.GOOGLE_API_KEY ? 'Yes' : 'No'}`);
  });
}
