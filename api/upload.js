import multer from 'multer';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Helper function to run multer
const runMiddleware = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Upload endpoint called');
    
    // Run multer middleware
    await runMiddleware(req, res, upload.single('pdf'));
    
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    console.log('File received:', req.file.originalname, 'Size:', req.file.size);

    // Process the PDF
    const pdfBuffer = req.file.buffer;
    const loader = new PDFLoader(pdfBuffer);
    const docs = await loader.load();

    // Split text into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const chunks = await textSplitter.splitDocuments(docs);

    // Create vector store
    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: 'embedding-001',
      apiKey: process.env.GOOGLE_API_KEY,
    });

    const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);

    // Store the vector store (in production, use a persistent database)
    // For now, we'll return success
    console.log('PDF processed successfully:', chunks.length, 'chunks created');

    res.status(200).json({
      success: true,
      message: 'PDF uploaded and processed successfully',
      chunks: chunks.length,
      filename: req.file.originalname
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Failed to process PDF',
      details: error.message
    });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
