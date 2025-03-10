// models/Message.ts

import mongoose, { Schema, Document, ObjectId } from "mongoose";

export interface IMessage extends Document {
  conversationId: ObjectId;
  sender: ObjectId;
  receiver?: ObjectId;
  content: string;
  image?: string;
  read: boolean;
}

const messageSchema: Schema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversaton",
      required: true,
    },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "User" },
    content: { type: String },
    image: { type: String },
    read: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model<IMessage>("Message", messageSchema);

export default Message;
