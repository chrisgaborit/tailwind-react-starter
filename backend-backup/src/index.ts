import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import storyboardRouter from './routes/storyboardRoute';
import uploadRouter from './routes/uploadRoute';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Main routes
app.use('/api/generate', storyboardRouter);
app.use('/api/upload', uploadRouter);

app.listen(PORT, () => {
  console.log(`✅ Genesis backend running on port ${PORT}`);
});
