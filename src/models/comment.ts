import { Schema, model, Document } from "mongoose";

export interface CommentDocument extends Document {
  postId: Schema.Types.ObjectId; // The post this comment belongs to
  userId: Schema.Types.ObjectId; // User who made the comment
  content: string; // Comment content
  parentCommentId?: Schema.Types.ObjectId; // Reference to parent comment for replies
  likes: Schema.Types.ObjectId[]; // Users who liked the comment
  reports: Schema.Types.ObjectId[]; // Reports on the comment
}

// Comment Schema
const CommentSchema = new Schema<CommentDocument>(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    parentCommentId: { type: Schema.Types.ObjectId, ref: "Comment" },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    reports: [{ type: Schema.Types.ObjectId, ref: "Report" }],
  },
  { timestamps: true }
);

const Comment = model<CommentDocument>("Comment", CommentSchema);
export default Comment;
