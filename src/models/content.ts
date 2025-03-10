import { Schema, model, Document } from "mongoose";

export enum MediaType {
  IMAGE = "image",
  VIDEO = "video",
}

export enum PostType {
  POST = "post",
  STORY = "story",
}

export interface Media {
  url: string;
  type: MediaType;
}

export interface IContent extends Document {
  userId: Schema.Types.ObjectId;
  location?: Schema.Types.ObjectId;
  likes: Schema.Types.ObjectId[];
}

const contenSchema = new Schema<IContent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    location: { type: Schema.Types.ObjectId, ref: "Location" },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true, discriminatorKey: "type" }
);

const Content = model<IContent>("Content", contenSchema);

export default Content;
