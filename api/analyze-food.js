// api/analyze-food.js - Complete file with CORS fix
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper to convert buffer to base64
function bufferToBase64(buffer) {
  return buffer.toString('base64');
}

// Parse multipart form data manually (Vercel doesn't include multer)
async function parseMultipartData(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    
    req.on('data', chunk => {
      data += chunk;
    });
    
    req.on('end', () => {
      try {
        const boundary = req.headers['content-type']?.split('boundary=')[1];
        if (!boundary) {
          return reject(new Error('No boundary found'));
        }
        
        const parts = data.split(`--${boundary}`);
        const result = {};
        
        for (const part of parts) {
          if (part.includes('Content-Disposition: form-data')) {
            const lines = part.split('\r\n');
            const dispositionLine = lines.find(line => line.includes('Content-Disposition'));
            
            if (dispositionLine) {
              const nameMatch = dispositionLine.match(/name="([^"]+)"/);
              if (nameMatch) {
                const fieldName = nameMatch[1];
                
                if (fieldName === 'image') {
                  // Find binary data
                  const dataStart = part.indexOf('\r\n\r\n') + 4;
                  const dataEnd = part.lastIndexOf('\r\n');
                  if (dataStart > 3 && dataEnd > dataStart) {
                    const imageData = part.slice(dataStart, dataEnd);
                    result.image = Buffer.from(imageData, 'binary');
                  }
                } else {
                  // Text field
                  const valueStart = part.indexOf('\r\n\r\n') + 4;
                  const valueEnd = part.lastIndexOf('\r\n');
                  if (valueStart > 3 && valueEnd > valueStart) {
                    result[fieldName] = part.slice(valueStart, valueEnd);
                  }
                }
              }
            }
          }
        }
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Main handler function
export default async function handler(req, res) {
  // CORS headers - MUST be first thing
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }
  
  const startTime = Date.now();
  
  try {
    // Check if OpenAI key exists
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI API key not configured'
      });
    }
    
    // Parse form data
    let formData;
    try {
      formData = await parseMultipartData(req);
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        error: 'Failed to parse form data. Please send multipart/form-data with an image field.'
      });
    }
    
    // Check if image was provided
    if (!formData.image) {
      return res.status(400).json({
        success: false,
        error: 'No image provided. Please upload a food photo.'
      });
    }
    
    // Convert image to base64
    const base64Image = bufferToBase64(formData.image);
    const userGoal = formData.goal || 'general';
    
    console.log('Analyzing food image...');
    
    // Create the AI prompt
    const prompt = `Analyze this food image and return ONLY a JSON response with this exact structure:

{
  "name": "Food name",
  "description": "Brief description",
  "calories": {"min": 300, "max": 450},
  "nutritionScore": 8.0,
  "confidence": 85,
  "insights": ["Health insight 1", "Health insight 2"]
}

Guidelines:
- Be conservative with calorie estimates
- Score nutrition 1-10 (whole foods = higher)
- Confidence should reflect how clearly you can see the food
- Include 2-3 helpful insights
- Consider the user goal: ${userGoal}

Return ONLY the JSON, no other text.`;
    
    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.1
    });
    
    // Parse the AI response
    let analysis;
    try {
      const aiResponse = response.choices[0].message.content;
      const cleanResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanResponse);
      
      // Validate the response has required fields
      if (!analysis.name || !analysis.calories) {
        throw new Error('Invalid AI response structure');
      }
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      analysis = {
        name: "Unknown Food",
        description: "Could not analyze this image clearly",
        calories: { min: 200, max: 400 },
        nutritionScore: 5.0,
        confidence: 30,
        insights: ["Please try taking another photo with better lighting"]
      };
    }
    
    // Add metadata
    analysis.processingTime = Date.now() - startTime;
    analysis.timestamp = new Date().toISOString();
    
    console.log(`Analysis completed: ${analysis.name} (${analysis.confidence}% confidence)`);
    
    // Return success response
    return res.status(200).json({
      success: true,
      data: analysis
    });
    
  } catch (error) {
    console.error('Analysis failed:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Food analysis failed. Please try again.',
      processingTime: Date.now() - startTime
    });
  }
}
