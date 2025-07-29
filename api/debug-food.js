import OpenAI from 'openai';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Debug info
    const debugInfo = {
      method: req.method,
      hasApiKey: !!process.env.OPENAI_API_KEY,
      keyPrefix: process.env.OPENAI_API_KEY?.substring(0, 7) + "...",
      contentType: req.headers['content-type'],
      hasBody: !!req.body,
    };
    
    if (req.method !== 'POST') {
      return res.status(200).json({
        message: "This endpoint requires POST method",
        debug: debugInfo
      });
    }
    
    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Simple test without image processing first
    return res.status(200).json({
      success: true,
      message: "Debug endpoint reached successfully",
      debug: debugInfo,
      note: "OpenAI initialized successfully"
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}