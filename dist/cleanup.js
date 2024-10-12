"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupOldFiles = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
async function cleanupOldFiles() {
    const directory = path_1.default.join(__dirname, '..', 'processed_images');
    const now = Date.now();
    try {
        const files = await promises_1.default.readdir(directory);
        for (const file of files) {
            const filePath = path_1.default.join(directory, file);
            const stats = await promises_1.default.stat(filePath);
            if (now - stats.mtime.getTime() > MAX_AGE_MS) {
                await promises_1.default.unlink(filePath);
                console.log(`Deleted old file: ${file}`);
            }
        }
    }
    catch (error) {
        console.error('Error during cleanup:', error);
    }
}
exports.cleanupOldFiles = cleanupOldFiles;
