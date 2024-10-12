import sharp from 'sharp';
import * as faceapi from 'face-api.js';
import { Canvas, Image, loadImage } from 'canvas';

// Polyfill for faceapi in Node environment
faceapi.env.monkeyPatch({ Canvas, Image } as any);

export async function processPhoto(photoBuffer: Buffer, config: any): Promise<string> {
  let image = sharp(photoBuffer);
  
  // Get image metadata
  const metadata = await image.metadata();
  const originalWidth = metadata.width!;
  const originalHeight = metadata.height!;

  console.log('Step 1: Detecting face');
  const inputBuffer = await image.toBuffer();
  const img = await loadImage(inputBuffer);
  const detections = await faceapi.detectSingleFace(img as any).withFaceLandmarks();

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
  } else {
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
