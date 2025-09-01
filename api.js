// Simple API handler for Vercel
export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { pathname } = new URL(req.url || '', `http://${req.headers.host}`);
  
  console.log(`API called: ${req.method} ${pathname}`);

  // Route based on pathname
  if (pathname === '/api/health' && req.method === 'GET') {
    return res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      message: 'Vercel API is working!',
      path: pathname
    });
  }

  if (pathname === '/api/test' && req.method === 'GET') {
    return res.status(200).json({
      message: 'Vercel API routes are working!',
      method: req.method,
      timestamp: new Date().toISOString(),
      success: true,
      path: pathname
    });
  }

  if (pathname === '/api/upload' && req.method === 'POST') {
    return res.status(200).json({
      success: true,
      message: 'Upload endpoint is working!',
      timestamp: new Date().toISOString(),
      method: req.method,
      path: pathname
    });
  }

  if (pathname === '/api/ask' && req.method === 'POST') {
    const { question } = req.body || {};
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    return res.status(200).json({
      success: true,
      answer: `You asked: "${question}". This endpoint is working!`,
      citations: [],
      question: question,
      timestamp: new Date().toISOString(),
      method: req.method,
      path: pathname
    });
  }

  // Default response
  res.status(200).json({
    message: 'Google NotebookLM Clone API',
    status: 'running',
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /api/health',
      'GET /api/test', 
      'POST /api/upload',
      'POST /api/ask'
    ],
    path: pathname
  });
}
