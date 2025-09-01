

export default async function handler(req, res) {
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
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Failed to process upload',
      details: error.message
    });
  }
}


