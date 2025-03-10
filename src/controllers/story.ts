import { Request, Response } from "express";
import { CustomRequest } from "../middleware/auth";
import Story from "../models/story";
import { uploadMediaToSupabase } from "../utils/media";
import { ObjectId } from "mongoose";

// Create a new story
export const createStory = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const { mediaType, caption, location } = req.body;
    // Assuming you are using some kind of authentication middleware to set req.user
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }
    const mediaUploadPromises: Promise<any>[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const mediaType = file.mimetype.startsWith("image") ? "image" : "video";
        mediaUploadPromises.push(
          uploadMediaToSupabase(file.buffer, file.filename, mediaType)
        );
      }
    }

    const mediaUploadResults = await Promise.all(mediaUploadPromises);
    console.log(mediaUploadResults);

    // Create a new story
    const newStory = new Story({
      userId: userId,
      location,
      media: mediaUploadResults[0],
      mediaType,
      caption,
    });

    // Save the story to the database
    const savedStory = await newStory.save();

    res
      .status(201)
      .json({ message: "Story created successfully", story: savedStory });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

// Get all stories, grouped by user
export const getAllStoriesGroupedByUser = async (
  req: Request,
  res: Response
) => {
  try {
    // Fetch stories that are not archived or deleted and created within the last 24 hours
    const stories = await Story.find({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Stories within 24 hours
    })
      .populate("userId", "username avatarUrl")
      .populate("location", "images locationName address");
    // .sort({ createdAt: -1 });

    // Group stories by user
    const groupedStories = stories.reduce((acc: any, story: any) => {
      const userId = story.userId._id;

      if (!acc[userId]) {
        acc[userId] = {
          _id: userId,
          user: {
            username: story.userId.username,
            avatarUrl: story.userId.avatarUrl,
          },
          stories: [],
        };
      }

      acc[userId].stories.push({
        _id: story._id,
        media: story.media,
        mediaType: story.mediaType,
        caption: story.caption,
        createdAt: story.createdAt,
        views: story.views,
        likes: story.likes,
        location: story.location,
      });

      return acc;
    }, {});

    // Convert the grouped object into an array for easier frontend handling
    const result = Object.values(groupedStories);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};

export const viewStory = async (req: CustomRequest, res: Response) => {
  try {
    const storyId = req.params.storyId;
    const userId = req.user?._id;

    const story = await Story.findById(storyId);

    if (!story) {
      res.status(404).json({ message: "Story not found" });
      return;
    }

    if (story.views.includes(userId as unknown as ObjectId)) {
      res.status(400).json({ message: "You have already viewed this story" });
      return;
    }

    // Add user to views
    story.views.push(userId as unknown as ObjectId);
    await story.save();

    res.status(200).json({ message: "Story viewed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Like a story
export const likeStory = async (req: CustomRequest, res: Response) => {
  try {
    const storyId = req.params.storyId;
    const userId = req.user?._id;

    const story = await Story.findById(storyId);

    if (!story) {
      res.status(404).json({ message: "Story not found" });
      return;
    }

    if (story.likes.includes(userId as unknown as ObjectId)) {
      res.status(400).json({ message: "You have already liked this story" });
      return;
    }

    // Add user to likes
    story.likes.push(userId as unknown as ObjectId);
    await story.save();

    res.status(200).json({ message: "Story liked successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// unLike a story
export const unlikeStory = async (req: CustomRequest, res: Response) => {
  try {
    const storyId = req.params.storyId;
    const userId = req.user!._id;

    const story = await Story.findById(storyId);

    if (!story) {
      res.status(404).json({ message: "Story not found" });
      return;
    }

    if (!story.likes.includes(userId as unknown as ObjectId)) {
      res.status(400).json({ message: "You have not like this story" });
      return;
    }

    // Add user to likes
    story.likes = story.likes.filter(
      (id) => id.toString() !== userId.toString()
    );
    await story.save();

    res.status(200).json({ message: "Story unliked successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
