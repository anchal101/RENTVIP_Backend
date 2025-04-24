import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import analyzeRoutes from './routes/analyze.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/api', analyzeRoutes);

// ✅ Add this route
app.get('/', (req, res) => {
  res.send('RENTVIP Backend is Live 🎉');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
