"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
const app = (0, express_1.default)();
// Allow all origins
app.use((0, cors_1.default)());
// Memory usage logging
app.use((req, res, next) => {
    const memUsage = process.memoryUsage();
    console.log(`Memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100} MB`);
    next();
});
const upload = (0, multer_1.default)();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3002;
// Load face-api models when the server starts
(function () {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, loadModels_1.loadModels)();
            console.log('Face-api models loaded successfully');
        }
        catch (error) {
            console.error('Failed to load face-api models:', error);
            process.exit(1); // Exit if models fail to load
        }
    });
})();
function generateUniqueId() {
    return crypto_1.default.randomBytes(16).toString('hex');
}
app.post('/process-photo', upload.single('photo'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Received request to /process-photo');
        if (!req.file) {
            console.log('No file received');
            return res.status(400).json({ error: 'Missing photo' });
        }
        console.log(`Received photo of size: ${req.file.size} bytes`);
        const config = JSON.parse(req.body.config || '{}');
        console.log('Processing photo with config:', config);
        const processedImageBase64 = yield (0, processPhoto_1.processPhoto)(req.file.buffer, config);
        console.log('Photo processed successfully');
        const uniqueId = generateUniqueId();
        console.log(`Generated unique ID: ${uniqueId}`);
        res.json({
            photoUrl: `data:image/png;base64,${processedImageBase64}`
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
    finally {
        // Suggest garbage collection
        if (global.gc) {
            global.gc();
        }
    }
}));
app.get('/download-image/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const imagePath = path_1.default.join(__dirname, '..', 'processed_images', `${id}.png`);
    try {
        res.sendFile(imagePath);
    }
    catch (error) {
        res.status(404).send('Image not found');
    }
}));
// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'An unexpected error occurred', details: err.message });
});
app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
    // Run cleanup every hour
    setInterval(cleanup_1.cleanupOldFiles, 60 * 60 * 1000);
});
