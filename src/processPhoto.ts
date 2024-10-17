import sharp from 'sharp';
import * as faceapi from 'face-api.js';
import { Canvas, Image, loadImage } from 'canvas';

// Polyfill for faceapi in Node environment
faceapi.env.monkeyPatch({ Canvas, Image } as any);

export async function processPhoto(photoBuffer: Buffer, config: any): Promise<string> {
  try {
    console.log('Starting photo processing');
    
    // Step 1: Load the image and get metadata
    let image = sharp(photoBuffer);
    const metadata = await image.metadata();
    const originalWidth = metadata.width!;
    const originalHeight = metadata.height!;
    console.log(`Original image size: ${originalWidth}x${originalHeight}`);

    // Step 2: Detect face in original image
    console.log('Detecting face');
    const inputBuffer = await image.toBuffer();
    const img = await loadImage(inputBuffer);
    const detections = await faceapi.detectSingleFace(img as any).withFaceLandmarks();

    if (detections) {
      console.log('Face detected. Adjusting image...');
      const faceBox = detections.detection.box;
      console.log(`Face box: x=${faceBox.x}, y=${faceBox.y}, width=${faceBox.width}, height=${faceBox.height}`);
      
      // Step 3: Calculate crop area based on face position
      const faceHeight = faceBox.height;
      const estimatedHeadHeight = faceHeight * 1.5; // Increased to account for hair
      const targetHeightRatio = 0.85; // Face should occupy 85% of image height
      
      const idealHeight = estimatedHeadHeight / targetHeightRatio;
      const idealWidth = idealHeight * (35 / 45);
      
      const centerX = faceBox.x + faceBox.width / 2;
      const centerY = faceBox.y + faceBox.height / 2;
      let cropLeft = Math.max(0, Math.round(centerX - idealWidth / 2));
      let cropTop = Math.max(0, Math.round(centerY - idealHeight * 0.5)); // Center the face vertically
      
      // Ensure crop area is within bounds
      cropLeft = Math.min(cropLeft, originalWidth - idealWidth);
      cropTop = Math.min(cropTop, originalHeight - idealHeight);
      
      console.log(`Crop box: left=${cropLeft}, top=${cropTop}, width=${idealWidth}, height=${idealHeight}`);
      
      // Step 4: Crop
      image = image.extract({ left: cropLeft, top: cropTop, width: Math.round(idealWidth), height: Math.round(idealHeight) });
      
      // Step 5: Resize if necessary to meet minimum dimensions
      const cropMetadata = await image.metadata();
      const cropWidth = cropMetadata.width!;
      const cropHeight = cropMetadata.height!;
      
      if (cropWidth < 350 || cropHeight < 450) {
        const scaleFactor = Math.max(350 / cropWidth, 450 / cropHeight);
        const newWidth = Math.round(cropWidth * scaleFactor);
        const newHeight = Math.round(cropHeight * scaleFactor);
        image = image.resize(newWidth, newHeight);
        console.log(`Resized to meet minimum dimensions: ${newWidth}x${newHeight}`);
      } else {
        console.log(`Final image size: ${cropWidth}x${cropHeight}`);
      }
    } else {
      console.warn('No face detected. Proceeding with center crop.');
      // Fallback to center crop if no face is detected
      const cropDimension = Math.min(originalWidth, originalHeight);
      const cropLeft = Math.round((originalWidth - cropDimension) / 2);
      const cropTop = Math.round((originalHeight - cropDimension) / 2);
      
      image = image.extract({ left: cropLeft, top: cropTop, width: cropDimension, height: cropDimension })
                   .resize(450, 450)  // Square crop
                   .extend({ top: 0, bottom: 87, left: 0, right: 0, background: { r: 255, g: 255, b: 255, alpha: 1 } }); // Extend to 35:45 ratio
    }

    const processedBuffer = await image.toBuffer();
    console.log('Photo processing completed successfully');
    return processedBuffer.toString('base64');
  } catch (error) {
    console.error('Error in processPhoto:', error);
    if (error instanceof Error) {
      console.error(error.stack);
    }
    throw error;
  }
}

