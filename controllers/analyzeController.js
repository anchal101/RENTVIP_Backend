import fs from 'fs';
import path from 'path';
import axios from 'axios';
import sharp from 'sharp';

export const analyzeByCategory = async (req, res) => {
  const { category, description = "Default room description" } = req.body;
  const images = req.files;

  if (!images || images.length === 0) {
    return res.status(400).json({ error: 'No images uploaded.' });
  }

  try {
    // Resize images to reduce payload (max width: 800px)
    const imageParts = await Promise.all(images.map(async (image) => {
      const filePath = path.resolve(image.path);
      const originalBuffer = fs.readFileSync(filePath);

      const resizedBuffer = await sharp(originalBuffer)
        .resize({ width: 800 }) // Resize to max width 800px
        .toBuffer();

      const base64 = resizedBuffer.toString('base64');
      const mimeType = image.mimetype || 'image/jpeg';

      return {
        inline_data: {
          mime_type: mimeType,
          data: base64,
        },
      };
    }));

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
    let cleaned = rawReply.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```(json)?/g, '').trim();
    }

    const json = JSON.parse(cleaned);

    if (category === 'room') {
      const { roomName, roomType, roomAmenities, description } = json;
      res.json({ category, analysis: { roomName, roomType, roomAmenities, description } });
    } else {
      res.json({ category, analysis: json });
    }

  } catch (error) {
    console.error(`🔥 Error analyzing ${category} images:`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    res.status(500).json({ error: `Failed to analyze ${category} images` });
  }
};
