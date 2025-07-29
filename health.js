export default function handler(req, res) {
  return res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    openai: process.env.OPENAI_API_KEY ? "configured" : "missing",
    version: "1.0.0"
  });
}