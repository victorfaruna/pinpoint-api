import mongoose, { Schema, Document, Model } from "mongoose";

interface ILead extends Document {
  customerName: string;
  email: string;
  phone: string;
  contactMethod: "text" | "email" | "call";
  address: string;
  serviceRequestDate: Date;
  details: string;
  location: Schema.Types.ObjectId;
  item: Schema.Types.ObjectId;
  partner: Schema.Types.ObjectId;
  conversationId?: Schema.Types.ObjectId;
  user: Schema.Types.ObjectId;
  uploadedMedia?: string[];
  status: "Pending" | "Active" | "Pool" | "Complete" | "Website Click";
  reason?: string;
  note: string;
  modifyDate?: Date;
  modifyTime?: string;
  modifyPrice?: string;
  dateCompleted?: Date;
  rating: number;
}

const LeadSchema: Schema<ILead> = new Schema(
  {
    customerName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String },
    contactMethod: {
      type: String,
      enum: ["text", "email", "call"],
    },
    address: { type: String },
    serviceRequestDate: { type: Date, required: true },
    details: { type: String, required: true },
    location: { type: Schema.Types.ObjectId, ref: "Location" },
    item: { type: Schema.Types.ObjectId, ref: "Item" },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation" },
    partner: { type: Schema.Types.ObjectId, ref: "User" },
    uploadedMedia: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["Pending", "Active", "Complete", "Pool", "Website Click"],
      default: "Pending",
    },
    reason: { type: String },
    note: { type: String },
    modifyDate: { type: String },
    modifyTime: { type: String },
    modifyPrice: { type: String },
    rating: { type: Number, default: 0 },
    dateCompleted: { type: String },
  },
  { timestamps: true }
);

// Create the Lead model
const Lead: Model<ILead> = mongoose.model<ILead>("Lead", LeadSchema);

export default Lead;
