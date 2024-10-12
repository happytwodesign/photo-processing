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
async function processPhoto(photoBuffer, config) {
    let image = (0, sharp_1.default)(photoBuffer);
    // Get image metadata
    const metadata = await image.metadata();
    const originalWidth = metadata.width;
    const originalHeight = metadata.height;
    console.log('Step 1: Detecting face');
    const inputBuffer = await image.toBuffer();
    const img = await (0, canvas_1.loadImage)(inputBuffer);
    const detections = await faceapi.detectSingleFace(img).withFaceLandmarks();
    let cropBox;
    if (detections) {
        console.log('Face detected, adjusting image...');
        const faceBox = detections.detection.box;
        const centerX = faceBox.x + faceBox.width / 2;
        const centerY = faceBox.y + faceBox.height / 2;
        // Calculate crop dimensions based on face position
        const cropWidth = Math.min(originalWidth, originalHeight * (35 / 45));
        const cropHeight = cropWidth * (45 / 35);
        cropBox = {
            left: Math.max(0, Math.round(centerX - cropWidth / 2)),
            top: Math.max(0, Math.round(centerY - cropHeight / 2)),
            width: Math.round(cropWidth),
            height: Math.round(cropHeight)
        };
    }
    else {
        console.warn('No face detected. Proceeding with center crop.');
        // Calculate crop dimensions for center crop
        const cropWidth = Math.min(originalWidth, originalHeight * (35 / 45));
        const cropHeight = cropWidth * (45 / 35);
        cropBox = {
            left: Math.round((originalWidth - cropWidth) / 2),
            top: Math.round((originalHeight - cropHeight) / 2),
            width: Math.round(cropWidth),
            height: Math.round(cropHeight)
        };
    }
    // Apply crop
    image = image.extract(cropBox);
    // Resize to 35x45 aspect ratio, preserving maximum size
    const targetWidth = Math.max(350, cropBox.width);
    const targetHeight = Math.round(targetWidth * (45 / 35));
    image = image.resize(targetWidth, targetHeight, { fit: 'fill' });
    console.log(`Final image size: ${targetWidth}x${targetHeight}`);
    const processedBuffer = await image.toBuffer();
    return processedBuffer.toString('base64');
}
exports.processPhoto = processPhoto;
