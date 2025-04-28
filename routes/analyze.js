import express from 'express';
import multer from 'multer';
import {analyzeByCategory}  from '../controllers/analyzeController.js';
import axios from 'axios';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/analyze', upload.array('images'), analyzeByCategory);

export default router;
