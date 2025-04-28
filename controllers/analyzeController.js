import fs from 'fs';
import path from 'path';
import axios from 'axios';

export const analyzeByCategory = async (req, res) => {
  const { category, description = "Default room description" } = req.body; // 'hotel' or 'room' and include description
  const images = req.files;

  if (!images || images.length === 0) {
    return res.status(400).json({ error: 'No images uploaded.' });
  }

  if (!description) {
    return res.status(400).json({ error: 'Description is required.' });
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

    // Define prompt based on category
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
     console.log("rawReply:::::::::",response.data.candidates)
    const rawReply = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log(`🧠 [${category.toUpperCase()}] Gemini Output:\n`, rawReply);

    // Log the entire response for debugging
    // console.log("Full API Response:", response.data);

    let cleaned = rawReply.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```(json)?/g, '').trim();
    }

    const json = JSON.parse(cleaned);
    
    // Ensure the response includes room name, type, amenities, and description
    if (category === 'room') {
      const { roomName, roomType, roomAmenities, description } = json;
      // Check if the values are default and handle accordingly
      if (roomName === "Default Room" || roomType === "Unknown") {
        console.warn("Received default values for room analysis. Please check the prompt or API response.");
      }
      res.json({ category, analysis: { roomName, roomType, roomAmenities, description } });
    } else {
      res.json({ category, analysis: json });
    }

    console.log('Form Data:', {
      category: 'hotel',
      description: description,
      images: images,
    });

  } catch (error) {
    console.error(`🔥 Error analyzing ${category} images:`, error.response?.data || error.message);
    res.status(500).json({ error: `Failed to analyze ${category} images` });
  }
};
