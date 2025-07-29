// api/proxy.js - Simple proxy to avoid CORS issues
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'GET') {
    // Proxy health check
    return res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      openai: process.env.OPENAI_API_KEY ? "configured" : "missing",
      cors: "enabled"
    });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}