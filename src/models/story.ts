import { Schema } from "mongoose";
import Content, { IContent, Media } from "./content";

// Story Model
interface IStory extends IContent {
  caption: string;
  views: Schema.Types.ObjectId[];
  media: Media;
}

const storySchema = new Schema<IStory>({
  caption: { type: String, maxlength: 300 },
  views: [{ type: Schema.Types.ObjectId, ref: "User" }],
  media: {
    url: { type: String, required: true },
    type: { type: String, enum: ["image", "video"], required: true },
  },
});

const Story = Content.discriminator<IStory>("Story", storySchema);

export default Story;
