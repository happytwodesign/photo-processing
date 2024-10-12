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
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const cleanup_1 = require("./cleanup");
const app = (0, express_1.default)();
// Updated CORS configuration
app.use((0, cors_1.default)({
    origin: [
        'https://schengenvisaphoto.com',
        'https://photoforvisa.com',
        'https://vercel.live',
        'https://schengen-visa-photo-generator-s6s7oko2k.vercel.app',
        'http://localhost:3000'
    ],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
const upload = (0, multer_1.default)();
const port = process.env.PORT || 3002;
// Load face-api models when the server starts
(0, loadModels_1.loadModels)().catch(console.error);
// Add this function at the top of the file
function generateUniqueId() {
    return crypto_1.default.randomBytes(16).toString('hex');
}
app.post('/process-photo', upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Missing photo' });
        }
        const config = JSON.parse(req.body.config || '{}');
        const processedImageBase64 = await (0, processPhoto_1.processPhoto)(req.file.buffer, config);
        const uniqueId = generateUniqueId();
        const imagePath = path_1.default.join(__dirname, '..', 'processed_images', `${uniqueId}.png`);
        await promises_1.default.mkdir(path_1.default.dirname(imagePath), { recursive: true });
        await promises_1.default.writeFile(imagePath, Buffer.from(processedImageBase64, 'base64'));
        res.json({
            photoUrl: `data:image/png;base64,${processedImageBase64}`,
            downloadUrl: `/download-image/${uniqueId}`
        });
    }
    catch (error) {
        console.error('Error processing photo:', error);
        res.status(500).json({ error: 'Failed to process photo' });
    }
});
app.get('/download-image/:id', async (req, res) => {
    const id = req.params.id;
    const imagePath = path_1.default.join(__dirname, '..', 'processed_images', `${id}.png`);
    try {
        await promises_1.default.access(imagePath);
        res.download(imagePath);
    }
    catch (error) {
        res.status(404).send('Image not found');
    }
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    // Run cleanup every hour
    setInterval(cleanup_1.cleanupOldFiles, 60 * 60 * 1000);
});
