export default function handler(req, res) {
  console.log('Health check called');
  
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Vercel API is working!',
    environment: process.env.NODE_ENV || 'development'
  });
}
