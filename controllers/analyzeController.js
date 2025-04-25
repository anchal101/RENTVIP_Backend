import fs from 'fs';
import path from 'path';
import axios from 'axios';

export const analyzeByCategory = async (req) => {
  const { category, description = "Default room description" } = req.body;
  const images = req.files;

  if (!images || images.length === 0) {
    console.error('❌ No images uploaded.');
    return;
  }

  try {
    const imageParts = images.map((image) => {
      const filePath = path.resolve(image.path);
      const buffer = fs.readFileSync(filePath);
      const base64 = buffer.toString('base64');
      const mimeType = image.mimetype || 'image/jpeg';
      return {
        inline_data: {
          mime_type: mimeType,
          data: base64,
        },
      };
    });

    const prompt =
      category === 'hotel'
        ? `You are a hotel image analysis assistant. Analyze the following description of the hotel: "${description}" and return ONLY a JSON like:
          {
            "description": "Short hotel description (max 50 words)",
            "amenities": ["Wifi", "Pool", "Gym"],
            "hotelStyle": "Modern"
          }`
        : `You are a hotel room analysis assistant. Analyze the following description of the room: "${description}" and return ONLY a JSON like:
          {
            "roomName": "Name of the room",
            "roomType": "Type of the room",
            "roomAmenities": ["List of amenities"],
            "description": "Description of the room"
          }`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              { text: prompt },
              ...imageParts,
            ],
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const rawReply = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log(`🧠 [${category.toUpperCase()}] Gemini Output:\n`, rawReply);

    let cleaned = rawReply.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```(json)?/g, '').trim();
    }

    const json = JSON.parse(cleaned);
    console.log('✅ Analysis Result:', json);

    // You can save result to DB or file if needed
  } catch (error) {
    console.error(`🔥 Error analyzing ${category} images:`, error.response?.data || error.message);
  }
};
