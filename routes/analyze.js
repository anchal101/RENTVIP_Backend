import express from 'express';
import multer from 'multer';
import { analyzeByCategory } from '../controllers/analyzeController.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/analyze', upload.array('images'), async (req, res) => {
  try {
    // Call the analysis AFTER responding
    await analyzeByCategory(req);
    
    // Send a success response
    res.status(200).json({ message: 'Images analyzed successfully' });
  } catch (error) {
    console.error('❌ Failed to analyze images:', error);
    res.status(500).json({ error: 'Failed to analyze images' });
  }
});

export default router;
