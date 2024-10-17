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
exports.cleanupOldFiles = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
function cleanupOldFiles() {
    return __awaiter(this, void 0, void 0, function* () {
        const directory = path_1.default.join(__dirname, '..', 'processed_images');
        const now = Date.now();
        try {
            const files = yield promises_1.default.readdir(directory);
            for (const file of files) {
                const filePath = path_1.default.join(directory, file);
                const stats = yield promises_1.default.stat(filePath);
                if (now - stats.mtime.getTime() > MAX_AGE_MS) {
                    yield promises_1.default.unlink(filePath);
                    console.log(`Deleted old file: ${file}`);
                }
            }
        }
        catch (error) {
            console.error('Error during cleanup:', error);
        }
    });
}
exports.cleanupOldFiles = cleanupOldFiles;
