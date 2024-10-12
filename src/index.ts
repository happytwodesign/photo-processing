import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { processPhoto } from './processPhoto';
import { loadModels } from './loadModels';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { cleanupOldFiles } from './cleanup';

const app = express();

// Updated CORS configuration
app.use(cors({
  origin: [
    'https://schengenvisaphoto.com',
    'https://photoforvisa.com',
    'https://vercel.live',
    'https://schengen-visa-photo-generator-s6s7oko2k.vercel.app',
    'https://schengen-visa-photo-generator.vercel.app',
    'http://localhost:3000',
    'https://visa-photo-generator-pbq02754w-alexandrap-toptalcoms-projects.vercel.app'
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const upload = multer();
const port = process.env.PORT || 3002;

// Load face-api models when the server starts
loadModels().catch(console.error);

// Add this function at the top of the file
function generateUniqueId(): string {
  return crypto.randomBytes(16).toString('hex');
}

app.post('/process-photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Missing photo' });
    }

    const config = JSON.parse(req.body.config || '{}');
    const processedImageBase64 = await processPhoto(req.file.buffer, config);

    const uniqueId = generateUniqueId();
    const imagePath = path.join(__dirname, '..', 'processed_images', `${uniqueId}.png`);
    await fs.mkdir(path.dirname(imagePath), { recursive: true });
    await fs.writeFile(imagePath, Buffer.from(processedImageBase64, 'base64'));

    res.json({ 
      photoUrl: `data:image/png;base64,${processedImageBase64}`,
      downloadUrl: `/download-image/${uniqueId}`
    });
  } catch (error) {
    console.error('Error processing photo:', error);
    res.status(500).json({ error: 'Failed to process photo' });
  }
});

app.get('/download-image/:id', async (req, res) => {
  const id = req.params.id;
  const imagePath = path.join(__dirname, '..', 'processed_images', `${id}.png`);
  
  try {
    await fs.access(imagePath);
    res.download(imagePath);
  } catch (error) {
    res.status(404).send('Image not found');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  // Run cleanup every hour
  setInterval(cleanupOldFiles, 60 * 60 * 1000);
});
