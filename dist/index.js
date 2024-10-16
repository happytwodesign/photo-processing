"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const cors_1 = __importDefault(require("cors"));
const processPhoto_1 = require("./processPhoto");
const loadModels_1 = require("./loadModels");
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const cleanup_1 = require("./cleanup");
const fs = require('fs');
const app = (0, express_1.default)();
// Updated CORS configuration
app.use((0, cors_1.default)({
    origin: [
        'https://schengenvisaphoto.com',
        'https://photoforvisa.com',
        'https://vercel.live',
        'https://schengen-visa-photo-generator-s6s7oko2k.vercel.app',
        'https://schengen-visa-photo-generator.vercel.app',
        'http://localhost:3000'
    ],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
const upload = (0, multer_1.default)();
const port = process.env.PORT || 3002;
// Load face-api models when the server starts
(0, loadModels_1.loadModels)().catch(console.error);
function generateUniqueId() {
    return crypto_1.default.randomBytes(16).toString('hex');
}
app.post('/process-photo', upload.single('photo'), async (req, res) => {
    try {
        console.log('Received request to /process-photo');
        if (!req.file) {
            console.log('No file received');
            return res.status(400).json({ error: 'Missing photo' });
        }
        console.log(`Received photo of size: ${req.file.size} bytes`);
        const config = JSON.parse(req.body.config || '{}');
        console.log('Processing photo with config:', config);
        const processedImageBase64 = await (0, processPhoto_1.processPhoto)(req.file.buffer, config);
        console.log('Photo processed successfully');
        const uniqueId = generateUniqueId();
        console.log(`Generated unique ID: ${uniqueId}`);
        res.json({
            photoUrl: `data:image/png;base64,${processedImageBase64}`,
            downloadUrl: `/download-image/${uniqueId}`
        });
        console.log('Response sent successfully');
    }
    catch (error) {
        console.error('Error in /process-photo route:', error);
        if (error instanceof Error) {
            console.error(error.stack);
            res.status(500).json({ error: 'Failed to process photo', details: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to process photo', details: 'An unknown error occurred' });
        }
    }
});
app.get('/download-image/:id', async (req, res) => {
    const id = req.params.id;
    const imagePath = path_1.default.join(__dirname, '..', 'processed_images', `${id}.png`);
    try {
        res.sendFile(imagePath);
    }
    catch (error) {
        res.status(404).send('Image not found');
    }
});
// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'An unexpected error occurred', details: err.message });
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    // Run cleanup every hour
    setInterval(cleanup_1.cleanupOldFiles, 60 * 60 * 1000);
});

function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

// In your cleanup function or wherever you're scanning the directory
function cleanupOldFiles() {
  const processedImagesDir = path.join(__dirname, '..', 'processed_images');
  ensureDirectoryExists(processedImagesDir);
  
  // ... (rest of your cleanup logic)
}
