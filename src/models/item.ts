import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReview {
  userId: Schema.Types.ObjectId;
  content: string;
  rating: number;
  image?: string;
}

interface ItemOption {
  optionCategory: string;
  optionName: string;
}

export interface IItem extends Document {
  user: Schema.Types.ObjectId;
  name: string;
  description: string;
  images: string[];
  location: Schema.Types.ObjectId[];
  mainCategory: string[];
  category: string[];
  subCategory?: string[];
  options?: ItemOption[];
  reviews?: IReview[];
  rating: number;
}

// Common Schemas for Reusable Sub-Documents
const ItemOptionSchema: Schema = new Schema({
  optionCategory: { type: String, required: true },
  optionName: { type: String, required: true },
});

const ReviewSchema: Schema<IReview> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    content: { type: String, required: true },
    rating: { type: Number, required: true },
    image: { type: String },
  },
  { timestamps: true }
);

// Base Item Schema
const ItemSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    images: { type: [String], required: true },
    location: [{ type: Schema.Types.ObjectId, ref: "Location" }],
    mainCategory: { type: [String], required: true },
    category: { type: [String], required: true },
    subCategory: { type: [String] },
    options: { type: [ItemOptionSchema] },
    reviews: { type: [ReviewSchema] },
    rating: { type: Number, default: 0 },
  },
  { timestamps: true, discriminatorKey: "type" }
);

// Create Base Model
const Item: Model<IItem> = mongoose.model<IItem>("Item", ItemSchema);

export default Item;
