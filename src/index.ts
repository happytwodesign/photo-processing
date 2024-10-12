import express from 'express';
import multer from 'multer';
import { processPhoto } from './processPhoto';
import { loadModels } from './loadModels';
import fs from 'fs/promises';
import path from 'path';

const app = express();
const upload = multer();
const port = process.env.PORT || 3002;

// Load face-api models when the server starts
loadModels().catch(console.error);

app.post('/process-photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Missing photo' });
    }

    const config = JSON.parse(req.body.config || '{}');
    const processedImageBase64 = await processPhoto(req.file.buffer, config);

    // Save the processed image to a file
    const imagePath = path.join(__dirname, '..', 'processed_images', `processed_${Date.now()}.png`);
    await fs.mkdir(path.dirname(imagePath), { recursive: true });
    await fs.writeFile(imagePath, Buffer.from(processedImageBase64, 'base64'));

    res.json({ 
      photoUrl: `data:image/png;base64,${processedImageBase64}`,
      downloadUrl: `/download-image?path=${encodeURIComponent(imagePath)}`
    });
  } catch (error) {
    console.error('Error processing photo:', error);
    res.status(500).json({ error: 'Failed to process photo' });
  }
});

app.get('/download-image', async (req, res) => {
  const imagePath = req.query.path as string;
  if (!imagePath) {
    return res.status(400).send('Missing image path');
  }
  res.download(imagePath);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
