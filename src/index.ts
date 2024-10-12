import '@tensorflow/tfjs';
import express from 'express';
import multer from 'multer';
import { processPhoto } from './processPhoto';
import { loadModels } from './loadModels';

const app = express();
const upload = multer();
const port = process.env.PORT || 3001;

// Load face-api models when the server starts
loadModels().catch(console.error);

app.post('/process-photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Missing photo' });
    }

    const config = JSON.parse(req.body.config || '{}');
    const processedImageBase64 = await processPhoto(req.file.buffer, config);

    res.json({ photoUrl: `data:image/png;base64,${processedImageBase64}` });
  } catch (error) {
    console.error('Error processing photo:', error);
    res.status(500).json({ error: 'Failed to process photo' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
