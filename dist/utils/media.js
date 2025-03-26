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
exports.deleteMediaFromSupabase = exports.downloadMediaFromSupabase = exports.uploadMediaToSupabase = void 0;
const uuid_1 = require("uuid");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Upload file to Supabase Storage
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey);
const uploadMediaToSupabase = (fileBuffer, fileName, mediaType) => __awaiter(void 0, void 0, void 0, function* () {
    const filePath = `${(0, uuid_1.v4)()}_${fileName}`;
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "pinpoint";
    try {
        const { data, error } = yield supabase.storage
            .from(bucketName)
            .upload(filePath, fileBuffer, {
            contentType: mediaType === "image" ? "image/jpeg" : "video/mp4",
        });
        if (error) {
            throw new Error(`Error uploading file to Supabase: ${error.message}`);
        }
        // Construct the public URL (if your bucket is public)
        const { data: publicUrlData, error: publicUrlError } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);
        if (publicUrlError || !publicUrlData) {
            throw new Error(`Error generating file URL: ${publicUrlError === null || publicUrlError === void 0 ? void 0 : publicUrlError.message}`);
        }
        return { url: publicUrlData.publicUrl, type: mediaType };
    }
    catch (err) {
        console.error("Error uploading file to Supabase:", err);
        throw new Error("Could not upload file to Supabase");
    }
});
exports.uploadMediaToSupabase = uploadMediaToSupabase;
// Download file from Supabase Storage
const downloadMediaFromSupabase = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    const bucketName = "your-bucket-name"; // Replace with your bucket name
    try {
        const { data, error } = yield supabase.storage
            .from(bucketName)
            .download(filePath);
        if (error) {
            throw new Error(`Error downloading file from Supabase: ${error.message}`);
        }
        // Return the file buffer or stream (depending on your use case)
        return data;
    }
    catch (error) {
        throw new Error(`Could not download media from Supabase`);
    }
});
exports.downloadMediaFromSupabase = downloadMediaFromSupabase;
// Delete file from Supabase Storage
const deleteMediaFromSupabase = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    const bucketName = "your-bucket-name"; // Replace with your bucket name
    try {
        const { error } = yield supabase.storage
            .from(bucketName)
            .remove([filePath]);
        if (error) {
            throw new Error(`Error deleting file from Supabase: ${error.message}`);
        }
        console.log(`Successfully deleted ${filePath} from Supabase storage.`);
    }
    catch (error) {
        console.error("Error deleting file from Supabase:", error);
        throw new Error("Could not delete file from Supabase");
    }
});
exports.deleteMediaFromSupabase = deleteMediaFromSupabase;
// // s3Utils.ts
// import {
//   S3Client,
//   PutObjectCommand,
//   DeleteObjectCommand,
//   GetObjectCommand,
// } from "@aws-sdk/client-s3";
// import fs from "fs";
// import { v4 as uuidv4 } from "uuid";
// const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "";
// const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "";
// const region = process.env.AWS_BUCKET_REGION || "";
// const bucket = process.env.AWS_BUCKET_NAME || "";
// const s3Client = new S3Client({
//   credentials: {
//     accessKeyId,
//     secretAccessKey,
//   },
//   region,
// });
// export const uploadMediaToS3 = async (
//   fileBuffer: Buffer,
//   fileName: string,
//   mediaType: string
// ): Promise<{ url: string; type: string }> => {
//   const key = `${uuidv4()}_${fileName}`;
//   const uploadParams = {
//     Bucket: bucket,
//     Key: key,
//     Body: fileBuffer,
//     ContentType: mediaType === "image" ? "image/jpeg" : "video/mp4",
//   };
//   try {
//     await s3Client.send(new PutObjectCommand(uploadParams));
//     return { url: key, type: mediaType };
//   } catch (err) {
//     console.error("Error uploading file to S3:", err);
//     throw new Error("Could not upload file to S3");
//   }
// };
// export const deleteMediaFromS3 = async (url: string) => {
//   try {
//     const deleteParams = {
//       Bucket: bucket,
//       Key: url,
//     };
//     await s3Client.send(new DeleteObjectCommand(deleteParams));
//     console.log(`Successfully deleted ${url} from S3 bucket: ${bucket}`);
//   } catch (error: any) {
//     console.error(`Error deleting media from S3: `, error);
//     throw new Error(`Could not delete media from S3: ${error.message}`);
//   }
// };
// export const downloadMediaFromS3 = async (key: string) => {
//   try {
//     const params = {
//       Bucket: bucket,
//       Key: key as string,
//     };
//     const command = new GetObjectCommand(params);
//     const response = await s3Client.send(command);
//     return response;
//   } catch (error: any) {
//     throw new Error(`Could not download media from S3: ${error.message}`);
//   }
// };
