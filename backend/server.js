require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const aiProcessor = require('./aiProcessor.js');

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

// Production file storage configuration
const isProduction = process.env.NODE_ENV === 'production';
const maxFileSize = isProduction ? 25 * 1024 * 1024 : 50 * 1024 * 1024; // 25MB in production, 50MB locally

console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Uploads directory: ${uploadsDir}`);
console.log(`Max file size: ${maxFileSize / (1024 * 1024)}MB`);
console.log(`Directory exists: ${fs.existsSync(uploadsDir)}`);
console.log(`Directory writable: ${fs.accessSync(uploadsDir, fs.constants.W_OK) ? 'Yes' : 'No'}`);

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
    fileSize: maxFileSize, // Use production-aware file size limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Production file cleanup and monitoring
if (isProduction) {
  // Clean up old files periodically (keep only last 10 files)
  setInterval(() => {
    try {
      const files = fs.readdirSync(uploadsDir);
      if (files.length > 10) {
        const fileStats = files.map(filename => {
          const filePath = path.join(uploadsDir, filename);
          const stats = fs.statSync(filePath);
          return { filename, filePath, mtime: stats.mtime };
        });
        
        // Sort by modification time and remove oldest files
        fileStats.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());
        const filesToRemove = fileStats.slice(0, fileStats.length - 10);
        
        filesToRemove.forEach(({ filename, filePath }) => {
          try {
            fs.unlinkSync(filePath);
            console.log(`Cleaned up old file: ${filename}`);
          } catch (error) {
            console.error(`Failed to clean up file ${filename}:`, error.message);
          }
        });
      }
    } catch (error) {
      console.error('File cleanup error:', error.message);
    }
  }, 30 * 60 * 1000); // Run every 30 minutes
  
  console.log('Production file cleanup enabled');
}

// Routes
app.post('/api/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Verify file was actually saved
    if (!fs.existsSync(req.file.path)) {
      return res.status(500).json({ error: 'File upload failed - file not saved' });
    }

    // Get file stats to verify
    const stats = fs.statSync(req.file.path);
    if (stats.size === 0) {
      // Remove empty file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Uploaded file is empty' });
    }

    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      path: req.file.path,
      uploadTime: new Date().toISOString(),
      mimeType: req.file.mimetype,
      savedPath: req.file.path,
      fileExists: fs.existsSync(req.file.path),
      fileSize: stats.size
    };

    console.log(`File uploaded successfully: ${req.file.filename} (${stats.size} bytes) at ${req.file.path}`);

    res.json({
      message: 'File uploaded successfully',
      file: fileInfo
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// NEW: Serve PDF files for viewing
app.get('/api/files/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    
    // Validate filename
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    const filePath = path.join(uploadsDir, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return res.status(404).json({ 
        error: 'File not found',
        filename: filename,
        path: filePath,
        uploadsDir: uploadsDir
      });
    }
    
    // Get file stats
    const stats = fs.statSync(filePath);
    
    // Check if it's actually a file (not a directory)
    if (!stats.isFile()) {
      return res.status(400).json({ error: 'Not a file' });
    }
    
    // Check file size
    if (stats.size === 0) {
      return res.status(400).json({ error: 'File is empty' });
    }
    
    // Set proper headers for PDF viewing
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.setHeader('Accept-Ranges', 'bytes');
    
    // Stream the file with error handling
    const fileStream = fs.createReadStream(filePath);
    
    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to read file' });
      }
    });
    
    fileStream.on('open', () => {
      console.log(`Serving file: ${filename} (${stats.size} bytes)`);
    });
    
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('File serving error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to serve file',
        details: error.message 
      });
    }
  }
});

// NEW: Download PDF files
app.get('/api/download/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Get original filename from metadata or use stored filename
    const originalName = filename.includes('-') ? filename.split('-').slice(2).join('-') : filename;
    
    // Set headers for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
    res.setHeader('Content-Length', fs.statSync(filePath).size);

    // Stream the file for download
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
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

// Debug endpoint to check file system status
app.get('/api/debug/files', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir);
    const fileDetails = files.map(filename => {
      const filePath = path.join(uploadsDir, filename);
      try {
        const stats = fs.statSync(filePath);
        return {
          filename,
          size: stats.size,
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory(),
          modified: stats.mtime,
          path: filePath
        };
      } catch (error) {
        return {
          filename,
          error: error.message
        };
      }
    });
    
    res.json({
      uploadsDir,
      totalFiles: files.length,
      files: fileDetails,
      directoryExists: fs.existsSync(uploadsDir),
      directoryStats: fs.existsSync(uploadsDir) ? fs.statSync(uploadsDir) : null
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ 
      error: 'Failed to get debug info',
      details: error.message,
      uploadsDir
    });
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
    console.log(`Uploads directory: ${uploadsDir}`);
  });
}
