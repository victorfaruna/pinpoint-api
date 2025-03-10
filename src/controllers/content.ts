import { Response } from "express";
import { CustomRequest } from "../middleware/auth";
import Content from "../models/content";
import { ObjectId } from "mongoose";

// Controller to get contents by location
export const getContentByLocation = async (
  req: CustomRequest,
  res: Response
) => {
  try {
    const { locationId } = req.params;

    // Validate locationId presence
    if (!locationId) {
      res.status(400).json({ message: "Location ID is required" });
      return;
    }

    // Fetch contents related to the locationId
    const contents = await Content.find({ location: locationId })
      .populate("userId", "username avatarUrl")
      .populate("location", "images locationName address")
      .sort({ createdAt: -1 });

    res.status(200).json(contents);
  } catch (error) {
    console.error("Error fetching contents for location:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

// Controller to get contents by user
export const getContentByUser = async (req: CustomRequest, res: Response) => {
  try {
    const { userId } = req.params;

    // Validate userId presence
    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    // Fetch contents related to the userId
    const contents = await Content.find({ userId })
      .populate("userId", "username avatarUrl")
      .populate("location", "images locationName address")
      .sort({ createdAt: -1 });

    res.status(200).json(contents);
  } catch (error) {
    console.error("Error fetching contents for user:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

// Like or Unlink a content
export const likeContent = async (req: CustomRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!._id;

  try {
    const content = await Content.findById(id);
    if (!content) {
      res.status(404).json({ message: "Content not found" });
      return;
    }

    // Check if the user has already liked the content
    if (content.likes.includes(userId as unknown as ObjectId)) {
      // If user has already liked, remove their ID from the likes array (unlike)
      content.likes = content.likes.filter(
        (like) => like.toString() !== userId.toString()
      );
      await content.save();
      res
        .status(200)
        .json({ message: "Content unliked successfully", content });
    } else {
      // If user hasn't liked, add their ID to the likes array (like)
      content.likes.push(userId as unknown as ObjectId);
      await content.save();
      res.status(200).json({ message: "Content liked successfully", content });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
};
