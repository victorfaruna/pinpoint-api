import { Schema, model, Document } from "mongoose";

export interface IConversation extends Document {
  participants: string[];
  type: "Chat" | "Lead";
  closed?: boolean;
  lead?: Schema.Types.ObjectId;
}

const conversationSchema = new Schema<IConversation>(
  {
    participants: [{ type: String, required: true }],
    type: { type: String, enum: ["Chat", "Lead"], required: true },
    closed: { type: Boolean, default: false },
    lead: { type: Schema.Types.ObjectId, ref: "Lead" },
  },
  { timestamps: true }
);

const Conversation = model<IConversation>("Conversation", conversationSchema);

export default Conversation;
