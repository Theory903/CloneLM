

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Upload endpoint called');
    
    // For now, just return success to test the endpoint
    // We'll implement full PDF processing later
    res.status(200).json({
      success: true,
      message: 'Upload endpoint is working!',
      timestamp: new Date().toISOString(),
      method: req.method,
      headers: req.headers
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Failed to process upload',
      details: error.message
    });
  }
}


