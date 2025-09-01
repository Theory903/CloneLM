export default function handler(req, res) {
  console.log('Test API called');
  res.status(200).json({
    message: 'Vercel API routes are working!',
    method: req.method,
    timestamp: new Date().toISOString(),
    success: true
  });
}
