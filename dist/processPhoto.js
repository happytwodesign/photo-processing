"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.processPhoto = void 0;
const sharp_1 = __importDefault(require("sharp"));
const faceapi = __importStar(require("face-api.js"));
const canvas_1 = require("canvas");
// Polyfill for faceapi in Node environment
faceapi.env.monkeyPatch({ Canvas: canvas_1.Canvas, Image: canvas_1.Image });
function processPhoto(photoBuffer, config) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Starting photo processing');
            // Step 1: Load the image and get metadata
            let image = (0, sharp_1.default)(photoBuffer);
            const metadata = yield image.metadata();
            const originalWidth = metadata.width;
            const originalHeight = metadata.height;
            console.log(`Original image size: ${originalWidth}x${originalHeight}`);
            // Step 2: Detect face in original image
            console.log('Detecting face');
            const inputBuffer = yield image.toBuffer();
            const img = yield (0, canvas_1.loadImage)(inputBuffer);
            const detections = yield faceapi.detectSingleFace(img).withFaceLandmarks();
            if (detections) {
                console.log('Face detected. Adjusting image...');
                const faceBox = detections.detection.box;
                console.log(`Face box: x=${faceBox.x}, y=${faceBox.y}, width=${faceBox.width}, height=${faceBox.height}`);
                // Step 3: Calculate crop area based on face position
                const faceHeight = faceBox.height;
                const estimatedHeadHeight = faceHeight * 1.6; // Increased to account for more hair and head space
                const targetHeightRatio = 0.65; // Face should occupy 65% of image height, allowing space for full head and shoulders
                const idealHeight = estimatedHeadHeight / targetHeightRatio;
                const idealWidth = idealHeight * (35 / 45);
                const centerX = faceBox.x + faceBox.width / 2;
                const centerY = faceBox.y + faceBox.height / 2;
                let cropLeft = Math.max(0, Math.round(centerX - idealWidth / 2));
                let cropTop = Math.max(0, Math.round(centerY - idealHeight * 0.55)); // Adjusted to place face slightly higher
                // Ensure crop area is within bounds
                cropLeft = Math.min(cropLeft, originalWidth - idealWidth);
                cropTop = Math.min(cropTop, originalHeight - idealHeight);
                console.log(`Crop box: left=${cropLeft}, top=${cropTop}, width=${idealWidth}, height=${idealHeight}`);
                // Step 4: Crop
                image = image.extract({ left: cropLeft, top: cropTop, width: Math.round(idealWidth), height: Math.round(idealHeight) });
                // Step 5: Resize if necessary to meet minimum dimensions
                const cropMetadata = yield image.metadata();
                const cropWidth = cropMetadata.width;
                const cropHeight = cropMetadata.height;
                if (cropWidth < 360 || cropHeight < 460) { // Increased minimum dimensions slightly
                    const scaleFactor = Math.max(360 / cropWidth, 460 / cropHeight);
                    const newWidth = Math.round(cropWidth * scaleFactor);
                    const newHeight = Math.round(cropHeight * scaleFactor);
                    image = image.resize(newWidth, newHeight);
                    console.log(`Resized to meet minimum dimensions: ${newWidth}x${newHeight}`);
                }
                else {
                    console.log(`Final image size: ${cropWidth}x${cropHeight}`);
                }
            }
            else {
                console.warn('No face detected. Proceeding with center crop.');
                // Fallback to center crop if no face is detected
                const cropDimension = Math.min(originalWidth, originalHeight);
                const cropLeft = Math.round((originalWidth - cropDimension) / 2);
                const cropTop = Math.round((originalHeight - cropDimension) / 2);
                image = image.extract({ left: cropLeft, top: cropTop, width: cropDimension, height: cropDimension })
                    .resize(450, 450) // Square crop
                    .extend({ top: 0, bottom: 87, left: 0, right: 0, background: { r: 255, g: 255, b: 255, alpha: 1 } }); // Extend to 35:45 ratio
            }
            const processedBuffer = yield image.toBuffer();
            console.log('Photo processing completed successfully');
            return processedBuffer.toString('base64');
        }
        catch (error) {
            console.error('Error in processPhoto:', error);
            if (error instanceof Error) {
                console.error(error.stack);
            }
            throw error;
        }
    });
}
exports.processPhoto = processPhoto;
