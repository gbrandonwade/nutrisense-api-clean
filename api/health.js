export default function handler(req, res) {
  // CORS headers - must be first
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    return res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      openai: process.env.OPENAI_API_KEY ? "configured" : "missing",
      version: "1.0.0"
    });
  } catch (error) {
    return res.status(500).json({
      error: "Health check failed",
      message: error.message
    });
  }
}
