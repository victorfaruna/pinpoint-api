import { Schema, model, Document } from "mongoose";

export interface IReview {
  userId: Schema.Types.ObjectId;
  title: string;
  content: string;
  rating: number;
  image?: string;
}

const ReviewSchema: Schema<IReview> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true },
    content: { type: String, required: true },
    rating: { type: Number, required: true },
    image: { type: String },
  },
  { timestamps: true }
);

// Define the LocationDocument Schema
export interface LocationDocument extends Document {
  partnerId: Schema.Types.ObjectId;
  locationName: string;
  images: string[];
  address: string;
  description: string;
  categories: string[];
  hoursOfOperation: {
    day: string;
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  }[];
  menu: string[];
  poll?: {
    question: string;
    options: string[];
  };
  coordinates: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  rating: number;
  reviews: IReview[];
  followers: Schema.Types.ObjectId[];
  likes: Schema.Types.ObjectId[];
}

// Mongoose Schema Definition
const locationSchema = new Schema<LocationDocument>(
  {
    partnerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    locationName: {
      type: String,
      required: true,
    },
    images: [{ type: String }],
    address: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    categories: {
      type: [String],
    },
    hoursOfOperation: [
      {
        day: { type: String, required: true },
        isOpen: { type: Boolean, required: true },
        closeTime: { type: String, required: true },
        openTime: { type: String, required: true },
      },
    ],
    menu: [{ type: String }],
    poll: {
      question: { type: String },
      options: [{ type: String }],
    },
    coordinates: {
      type: {
        type: String,
        enum: ["Point"], // GeoJSON object type
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number], // Array of numbers: [longitude, latitude]
        required: true,
      },
    },
    reviews: { type: [ReviewSchema] },
    rating: { type: Number, default: 0 },
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// Create a 2dsphere index on the coordinates field
locationSchema.index({ coordinates: "2dsphere" });

// Create and export the model
const Location = model<LocationDocument>("Location", locationSchema);

export default Location;
