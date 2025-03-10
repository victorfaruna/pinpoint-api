import { Response } from "express";
import { deleteMediaFromSupabase, uploadMediaToSupabase } from "../utils/media";
import { ObjectId } from "mongoose";
import Report, { ReportDocument, ReportType } from "../models/report";
import { CustomRequest } from "../middleware/auth";
import Post from "../models/post";

export const createPost = async (req: CustomRequest, res: Response) => {
  const { content, location } = req.body;
  const userId = req.user!._id;

  // Handle media files
  const mediaUploadPromises: Promise<any>[] = [];
  if (req.files && Array.isArray(req.files)) {
    for (const file of req.files) {
      const mediaType = file.mimetype.startsWith("image") ? "image" : "video";
      mediaUploadPromises.push(
        uploadMediaToSupabase(file.buffer, file.filename, mediaType)
      );
    }
  }

  try {
    const mediaUploadResults = await Promise.all(mediaUploadPromises);
    const newPost = new Post({
      userId,
      location,
      content,
      media: mediaUploadResults,
    });

    await newPost.save();
    res
      .status(201)
      .json({ message: "Post created successfully", post: newPost });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const getAllPost = async (req: CustomRequest, res: Response) => {
  try {
    const posts = await Post.find()
      .populate("location", "locationName address images")
      .populate("userId", "locationName address images")
      .sort({ createdAt: -1 });
    res.status(200).json(posts);
    return;
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

// Get a single post by ID
export const getPostById = async (req: CustomRequest, res: Response) => {
  const { id } = req.params;

  try {
    const post = await Post.findById(id)
      .populate("comments")
      .populate("likes")
      .populate("reports");
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }
    res.status(200).json(post);
    return;
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

// Update a post (only owner can update)
export const updatePost = async (req: CustomRequest, res: Response) => {
  const { id } = req.params;
  const { content, existingMedia } = req.body;
  const userId = req.user!._id;

  try {
    const post = await Post.findById(id);
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    // Ensure only the owner of the post can update it
    if (post.userId.toString() !== userId.toString()) {
      res.status(403).json({ message: "Unauthorized to update this post" });
      return;
    }

    // Update content
    post.content = content || post.content;

    // Handle media update
    const currentMedia = post.media || [];
    const newMediaUrls = existingMedia || []; // URLs of media to keep

    // Identify media to delete
    const mediaToDelete = currentMedia.filter(
      (media) => !newMediaUrls.includes(media.url)
    );

    // Delete media from S3
    await Promise.all(
      mediaToDelete.map(async (media) => {
        await deleteMediaFromSupabase(media.url); // Function to delete the file from S3
      })
    );

    // Handle new media uploads
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const mediaUploads = await Promise.all(
        (req.files as Express.Multer.File[]).map(async (file) => {
          const mediaType = file.mimetype.startsWith("image")
            ? "image"
            : "video";
          const uploadResult: any = await uploadMediaToSupabase(
            file.buffer,
            file.filename,
            mediaType
          );

          return { url: uploadResult.Location, type: mediaType }; // Adjust based on your uploadMediaToS3
        })
      );

      // Update post media with new uploaded URLs
      post.media = [...newMediaUrls, ...mediaUploads];
    } else {
      // If no new files, just keep the existing ones that are wanted
      post.media = newMediaUrls;
    }

    await post.save();

    res.status(200).json({ message: "Post updated successfully", post });
    return;
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

// Delete a post (only owner can delete)
export const deletePost = async (req: CustomRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!._id;

  try {
    const post = await Post.findById(id);
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    // Ensure only the owner of the post can delete it
    if (post.userId.toString() !== userId.toString()) {
      res.status(403).json({ message: "Unauthorized to delete this post" });
      return;
    }

    // Delete media files associated with the post
    if (post.media && post.media.length > 0) {
      await Promise.all(
        post.media.map(async (media) => {
          await deleteMediaFromSupabase(media.url); // Function to delete the file from S3
        })
      );
    }

    // Delete the post from the database
    await post.deleteOne();

    res
      .status(200)
      .json({ message: "Post and associated media deleted successfully" });
    return;
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

// Like or Unlink a post
export const likePost = async (req: CustomRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!._id;

  try {
    const post = await Post.findById(id);
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    // Check if the user has already liked the post
    if (post.likes.includes(userId as unknown as ObjectId)) {
      // If user has already liked, remove their ID from the likes array (unlike)
      post.likes = post.likes.filter(
        (like) => like.toString() !== userId.toString()
      );
      await post.save();
      res.status(200).json({ message: "Post unliked successfully", post });
    } else {
      // If user hasn't liked, add their ID to the likes array (like)
      post.likes.push(userId as unknown as ObjectId);
      await post.save();
      res.status(200).json({ message: "Post liked successfully", post });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

// Report a post
export const reportPost = async (req: CustomRequest, res: Response) => {
  const { id } = req.params; // Post ID
  const { reason, description } = req.body; // Reason and optional description for the report
  const userId = req.user!._id; // Reporter ID

  try {
    // Find the post to be reported
    const post = await Post.findById(id);
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    // Create a new report
    const newReport = new Report({
      userId,
      reportType: ReportType.POST, // Indicating this is a post report
      reportId: id, // The ID of the post being reported
      reason,
      description,
    });

    // Save the report in the database
    const savedReport: ReportDocument = await newReport.save();

    // Save the post after adding the report ID
    await post.save();
    res
      .status(201)
      .json({ message: "Post reported successfully", report: savedReport });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};
