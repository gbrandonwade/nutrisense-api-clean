import OpenAI from 'openai';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    // Check if API key exists
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OpenAI API key not found in environment variables"
      });
    }
    
    // Test OpenAI connection with a simple text request
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Say 'API test successful'" }],
      max_tokens: 10
    });
    
    return res.status(200).json({
      success: true,
      message: "OpenAI API is working!",
      response: response.choices[0].message.content,
      keyPrefix: process.env.OPENAI_API_KEY.substring(0, 7) + "..."
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      errorType: error.name,
      keyExists: !!process.env.OPENAI_API_KEY,
      keyPrefix: process.env.OPENAI_API_KEY ? 
        process.env.OPENAI_API_KEY.substring(0, 7) + "..." : "Not found"
    });
  }
}