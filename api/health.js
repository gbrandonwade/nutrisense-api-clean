export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  return res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    openai: process.env.OPENAI_API_KEY ? "configured" : "missing",
    version: "1.0.0"
  });
}
