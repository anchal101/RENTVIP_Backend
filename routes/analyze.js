import express from 'express';
import multer from 'multer';
import { analyzeByCategory } from '../controllers/analyzeController.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/analyze', upload.array('images'), async (req, res) => {
  try {
    res.status(202).json({ message: 'Analysis started, results will be logged on server.' });

    // Call the analysis AFTER responding
    await analyzeByCategory(req);
  } catch (error) {
    console.error('❌ Failed to analyze images:', error);
  }
});

export default router;
