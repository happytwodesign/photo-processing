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
exports.loadModels = void 0;
const faceapi = __importStar(require("face-api.js"));
const path_1 = __importDefault(require("path"));
let modelsLoaded = false;
async function loadModels() {
    if (modelsLoaded)
        return;
    const modelsPath = path_1.default.join(process.cwd(), 'src', 'models');
    try {
        // Load SSD MobileNet v1 model
        await faceapi.nets.ssdMobilenetv1.loadFromUri(modelsPath);
        // Load Face Landmark 68 model
        await faceapi.nets.faceLandmark68Net.loadFromUri(modelsPath);
        modelsLoaded = true;
        console.log('Face-api models loaded successfully');
    }
    catch (error) {
        console.error('Error loading face-api models:', error);
        throw error;
    }
}
exports.loadModels = loadModels;
