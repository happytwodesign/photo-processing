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
    const faceHeight = faceBox.height;
    
    // Calculate crop dimensions based on face height (70% of image height)
    const cropHeight = faceHeight / 0.7;
    const cropWidth = cropHeight * (35 / 45);
    
    const centerX = faceBox.x + faceBox.width / 2;
    const centerY = faceBox.y + faceBox.height / 2;
    
    cropBox = {
      left: Math.max(0, Math.round(centerX - cropWidth / 2)),
      top: Math.max(0, Math.round(centerY - cropHeight * 0.4)), // Position face slightly above center
      width: Math.round(cropWidth),
      height: Math.round(cropHeight)
    };

    // Ensure the crop box doesn't exceed image boundaries
    cropBox.left = Math.min(cropBox.left, originalWidth - cropBox.width);
    cropBox.top = Math.min(cropBox.top, originalHeight - cropBox.height);
  } else {
    console.warn('No face detected. Proceeding with center crop.');
    // Calculate crop dimensions for center crop
    const cropHeight = originalHeight;
    const cropWidth = cropHeight * (35 / 45);
    
    cropBox = {
      left: Math.round((originalWidth - cropWidth) / 2),
      top: 0,
      width: Math.round(cropWidth),
      height: Math.round(cropHeight)
    };
  }

  // Apply crop
  image = image.extract(cropBox);

  // Resize to 35x45 aspect ratio, preserving maximum size with a minimum of 350x450
  const targetWidth = Math.max(350, cropBox.width);
  const targetHeight = Math.round(targetWidth * (45 / 35));
  image = image.resize(targetWidth, targetHeight, { fit: 'fill' });

  console.log(`Final image size: ${targetWidth}x${targetHeight}`);

  const processedBuffer = await image.toBuffer();
  return processedBuffer.toString('base64');
}
