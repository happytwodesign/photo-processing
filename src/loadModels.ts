import * as faceapi from 'face-api.js';
import * as tf from '@tensorflow/tfjs';
import * as path from 'path';
import fs from 'fs/promises';

let modelsLoaded = false;

export async function loadModels() {
  if (modelsLoaded) return;
  const modelsPath = path.join(process.cwd(), 'src', 'models');

  try {
    // Custom function to load model weights
    const loadModel = async (modelName: string) => {
      const manifestPath = path.join(modelsPath, `${modelName}-weights_manifest.json`);
      console.log(`Loading manifest from: ${manifestPath}`);
      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
      console.log(`Manifest content: ${JSON.stringify(manifest, null, 2)}`);
      
      const weightMap: faceapi.tf.NamedTensorMap = {};
      
      for (const group of manifest) {
        console.log(`Processing group: ${JSON.stringify(group, null, 2)}`);
        for (const pathItem of group.paths) {
          const filePath = path.join(modelsPath, pathItem);
          console.log(`Loading weights from: ${filePath}`);
          const buf = await fs.readFile(filePath);
          
          // Ensure the buffer length is a multiple of 4
          const paddedLength = Math.ceil(buf.length / 4) * 4;
          const paddedBuffer = Buffer.alloc(paddedLength);
          buf.copy(paddedBuffer);
          
          const weights = new Float32Array(paddedBuffer.buffer, 0, buf.length / 4);
          
          if (!group.shapes || group.shapes.length === 0) {
            console.warn(`No shapes defined for ${pathItem}, inferring shape from weights length`);
            const shape = [weights.length];
            console.log(`Creating tensor with shape: ${shape}`);
            const tensor = tf.tensor(weights, shape);
            weightMap[pathItem] = tensor as unknown as faceapi.tf.Tensor;
          } else {
            const shape = group.shapes[0];
            console.log(`Creating tensor with shape: ${shape}`);
            const tensor = tf.tensor(weights, shape);
            weightMap[pathItem] = tensor as unknown as faceapi.tf.Tensor;
          }
        }
      }

      return weightMap;
    };

    // Load SSD MobileNet v1 model
    console.log('Loading SSD MobileNet v1 model...');
    const ssdMobilenetv1Model = await loadModel('ssd_mobilenetv1_model');
    await faceapi.nets.ssdMobilenetv1.loadFromWeightMap(ssdMobilenetv1Model);

    // Load Face Landmark 68 model
    console.log('Loading Face Landmark 68 model...');
    const faceLandmark68Model = await loadModel('face_landmark_68_model');
    await faceapi.nets.faceLandmark68Net.loadFromWeightMap(faceLandmark68Model);

    modelsLoaded = true;
    console.log('Face-api models loaded successfully');
  } catch (error) {
    console.error('Error loading face-api models:', error);
    throw error;
  }
}
