import { Response } from "express";
import Message from "../models/message";
import User from "../models/user";
import Conversation from "../models/conversation";
import mongoose from "mongoose";
import { CustomRequest } from "../middleware/auth";

// Send a message
export const sendMessage = async (req: CustomRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { content, image, conversationId, participantId, type } = req.body;
    const sender = req.user?._id!;

    let conversation;

    // Create or find conversation
    if (!conversationId) {
      if (!type) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({
          message: "Type is required",
        });
        return;
      }

      if (type === "Chat" && !participantId) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({
          message: "participantId is required",
        });
        return;
      }

      let query = { participants: { $all: [sender] }, type };

      if (participantId) {
        query = { participants: { $all: [sender, participantId] }, type };
      }

      conversation = await Conversation.findOneAndUpdate(
        query,
        {
          $setOnInsert: {
            participants: participantId ? [sender, participantId] : [sender],
            type,
          },
        },
        { upsert: true, new: true, session }
      );
    } else {
      conversation = await Conversation.findById(conversationId).session(
        session
      );
    }

    if (!conversation) {
      await session.abortTransaction();
      session.endSession();
      res.status(400).json({
        message: "Unable to find or create conversation",
      });
      return;
    }

    // Ensure sender is part of conversation
    if (!conversation.participants.includes(sender)) {
      await session.abortTransaction();
      session.endSession();
      res.status(400).json({
        message: "Invalid conversation or unauthorized access",
      });
      return;
    }

    // Determine the receiver from the conversation if participants exist
    let receiver;
    if (conversation.participants.length > 1) {
      receiver = conversation.participants.find(
        (participant) => participant !== sender.toString()
      );
      if (!receiver) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({
          message: "Receiver not found in the conversation",
        });
        return;
      }
    }

    // Create and save message
    const newMessage = new Message({
      sender,
      conversationId: conversation._id,
      receiver,
      image,
      content,
    });
    const savedMessage = await newMessage.save({ session });

    // Access the io instance from the app
    // const io = req.app.get("io");

    // Fetch receiver user and admin users in parallel
    // const [receiverUser, adminUsers] = await Promise.all([
    //   receiver ? User.findById(receiver).session(session) : null,
    //   type !== "Chat" ? User.find({ role: "Admin" }).session(session) : [],
    // ]);
    // if (receiverUser && receiverUser.socketId) {
    //   if (receiverUser.socketId) {
    //     io.to(receiverUser.socketId).emit("message", savedMessage, type);
    //   } else if (conversation.isGuest) {
    //     //send email
    //   }
    // } else if (type !== "Chat") {
    //   adminUsers.forEach((user: any) => {
    //     console.log(user.username);
    //     if (user.socketId) {
    //       io.to(user.socketId).emit("message", savedMessage, type);
    //     }
    //   });
    // }

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Respond with the saved message
    res.status(201).json({ message: savedMessage });
  } catch (error) {
    // Abort the transaction in case of errors
    await session.abortTransaction();
    session.endSession();

    // Handle errors
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Failed sending message", error });
  }
};

// Retrieve messages between two users
export const getMessages = async (req: CustomRequest, res: Response) => {
  try {
    const { conversationId } = req.params;
    const userId = req?.user?._id!;

    // Find the conversation and ensure it exists
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      res
        .status(404)
        .json({ status: false, message: "Conversation not found" });
      return;
    }

    // Check if the user is a participant in the conversation
    const isParticipant = conversation.participants.includes(userId);

    if (!isParticipant) {
      res.status(403).json({ status: false, message: "Access forbidden" });
      return;
    }

    // Retrieve and return messages
    const messages = await Message.find({ conversationId }).sort({
      createdAt: 1,
    });
    res.json({ status: true, messages });
  } catch (error) {
    console.error("Error getting messages:", error);
    res.status(500).json({ message: "Error getting messages", error });
  }
};

// Get list of conversations for a user
export const getUserConversations = async (
  req: CustomRequest,
  res: Response
) => {
  try {
    const { type } = req.params;
    const userId = req.user?._id as string;

    const conversations = await Conversation.find({
      participants: userId,
      type,
      closed: false,
    }).sort({ createdAt: -1 });

    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conversation) => {
        const lastMessage = await Message.findOne({
          conversationId: conversation._id,
        }).sort({ createdAt: -1 });
        const otherUserId = conversation.participants.find(
          (id) => id !== userId.toString()
        );
        const otherUser: any = otherUserId
          ? await User.findById(otherUserId).select("username avatarUrl")
          : null;

        return {
          ...conversation.toObject(),
          lastMessage,
          otherUser: otherUser
            ? { username: otherUser.username, image: otherUser.avatarUrl }
            : undefined,
        };
      })
    );

    const conversationsWithUnreadCount = await Promise.all(
      conversationsWithDetails.map(async (conversation) => {
        const unreadMessages = await Message.find({
          conversationId: conversation._id,
          receiver: userId,
          read: false,
        });
        const unreadCount = unreadMessages.length;

        return { ...conversation, unreadCount };
      })
    );

    res.json({ conversations: conversationsWithUnreadCount });
  } catch (error) {
    console.error("Error fetching user conversations by type:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getConversationById = async (
  req: CustomRequest,
  res: Response
) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?._id as string;

    // Find the conversation by ID and check if the user is a participant
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    // Get the last message in the conversation
    const lastMessage = await Message.findOne({
      conversationId: conversation._id,
    }).sort({ createdAt: -1 });

    // Identify the other user in the conversation
    const otherUserId = conversation.participants.find(
      (id) => id !== userId.toString()
    );

    const otherUser: any = otherUserId
      ? await User.findById(otherUserId).select("username avatarUrl")
      : null;

    // Fetch unread messages for the current user
    const unreadMessages = await Message.find({
      conversationId: conversation._id,
      receiver: userId,
      read: false,
    });

    const unreadCount = unreadMessages.length;

    // Prepare the response
    const conversationWithDetails = {
      ...conversation.toObject(),
      lastMessage,
      otherUser: otherUser
        ? { username: otherUser.username, image: otherUser.avatarUrl }
        : undefined,
      unreadCount,
    };

    res.json({ conversation: conversationWithDetails });
  } catch (error) {
    console.error("Error fetching conversation by ID:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const startConversation = async (req: CustomRequest, res: Response) => {
  try {
    const { participantId, type } = req.body;
    const userId = req.user?._id;

    // Check if the conversation already exists
    let existingConversation = await Conversation.findOne({
      participants: { $all: [userId, participantId] },
      type,
    });

    if (existingConversation) {
      res.json({ status: true, conversation: existingConversation }); // Return existing conversation
      return;
    }

    // If conversation doesn't exist, create a new one
    const newConversation = await Conversation.create({
      participants: [userId, participantId],
      type,
    });

    res.status(201).json({ status: true, conversation: newConversation });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ status: false, message: "Error Starting conversations", error });
  }
};
