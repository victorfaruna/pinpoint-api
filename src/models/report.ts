import { Schema, model, Document } from "mongoose";

// Enum to represent the type of entity being reported
export enum ReportType {
  USER = "user",
  POST = "post",
  COMMENT = "comment",
  OTHER = "other",
}

// Define the Report document interface
export interface ReportDocument extends Document {
  userId: Schema.Types.ObjectId; // User who is reporting
  reportType: ReportType; // Type of the entity being reported (user, post, comment, etc.)
  reportId: Schema.Types.ObjectId; // The ID of the entity being reported (can be a User, Post, Comment, or others)
  reason: string; // Reason for the report
  description?: string; // Optional additional details about the report
  createdAt: Date;
  updatedAt: Date;
}

// Generalized Report Schema
const ReportSchema = new Schema<ReportDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Reporter
    reportType: {
      type: String,
      enum: Object.values(ReportType),
      required: true,
    }, // Type of report
    reportId: { type: Schema.Types.ObjectId, required: true }, // Entity being reported (User, Post, Comment, etc.)
    reason: { type: String, required: true }, // Reason for reporting
    description: { type: String }, // Additional optional description
  },
  { timestamps: true }
);

// Create and export the Report model
const Report = model<ReportDocument>("Report", ReportSchema);
export default Report;
