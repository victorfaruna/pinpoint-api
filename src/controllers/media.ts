import { Request, Response } from "express";
import supabase from "../config/supabase";

import dotenv from "dotenv";

dotenv.config();

export const downloadMedia = async (req: Request, res: Response) => {
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
    const { data, error } = await supabase.storage
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

    const mediaBuffer = await data.arrayBuffer();
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
    } else {
      res.writeHead(200, {
        "Content-Type": contentType,
        "Content-Length": mediaBuffer.byteLength,
      });
      res.end(Buffer.from(mediaBuffer));
    }
  } catch (error) {
    console.error("Media download error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
