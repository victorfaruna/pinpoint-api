import { Schema } from "mongoose";
import Content, { IContent, Media } from "./content";

export interface IPost extends IContent {
  content: string;
  media: Media[];
}

const postSchema = new Schema<IPost>({
  content: { type: String },
  media: [
    {
      url: { type: String, required: true },
      type: { type: String, enum: ["image", "video"], required: true },
    },
  ],
});

const Post = Content.discriminator<IPost>("Post", postSchema);

export default Post;
