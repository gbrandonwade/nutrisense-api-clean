export default function handler(req, res) {
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
