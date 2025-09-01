export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Health check called');
  
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Vercel API is working!',
    environment: process.env.NODE_ENV || 'development',
    method: req.method
  });
}
