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
exports.downloadMedia = void 0;
const supabase_1 = __importDefault(require("../config/supabase"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const downloadMedia = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { key } = req.params;
        const range = req.headers.range;
        if (!key) {
            res.status(400).json({
                message: "key is required",
            });
            return;
        }
        // Log the request details for debugging
        console.log("Attempting to download:", {
            bucket: "pinpoint",
            key: key,
            range: range,
        });
        // Fetch the file from Supabase Storage
        const { data, error } = yield supabase_1.default.storage
            .from(process.env.SUPABASE_STORAGE_BUCKET || "pinpoint") // Make bucket name configurable
            .download(key);
        if (error) {
            console.error("Supabase download error:", error);
            res.status(404).json({
                message: "Media not found",
                error: error.message,
            });
            return;
        }
        if (!data) {
            res.status(404).json({ message: "No data received from storage" });
            return;
        }
        const mediaBuffer = yield data.arrayBuffer();
        const contentType = data.type || "application/octet-stream";
        if (contentType.startsWith("video") && range) {
            const [start, end] = range
                .replace(/bytes=/, "")
                .split("-")
                .map(Number);
            const videoEnd = end || mediaBuffer.byteLength - 1;
            const chunkSize = videoEnd - start + 1;
            res.writeHead(206, {
                "Content-Range": `bytes ${start}-${videoEnd}/${mediaBuffer.byteLength}`,
                "Accept-Ranges": "bytes",
                "Content-Length": chunkSize,
                "Content-Type": contentType,
            });
            res.end(Buffer.from(mediaBuffer).slice(start, videoEnd + 1));
        }
        else {
            res.writeHead(200, {
                "Content-Type": contentType,
                "Content-Length": mediaBuffer.byteLength,
            });
            res.end(Buffer.from(mediaBuffer));
        }
    }
    catch (error) {
        console.error("Media download error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.downloadMedia = downloadMedia;
