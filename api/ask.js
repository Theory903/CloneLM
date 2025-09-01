

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Ask endpoint called');
    
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    console.log('Question received:', question);

    // For now, return a simple response to test the endpoint
    // We'll implement full AI processing later
    res.status(200).json({
      success: true,
      answer: `You asked: "${question}". This endpoint is working!`,
      citations: [],
      question: question,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Ask error:', error);
    res.status(500).json({
      error: 'Failed to generate response',
      details: error.message
    });
  }
}
