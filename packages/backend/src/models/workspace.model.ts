import mongoose, { Schema } from "mongoose";
import { WorkspaceDocument } from "../types/database.types";

const workspaceSchema = new Schema<WorkspaceDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: {
      type: [
        {
          user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          role: {
            type: String,
            required: true,
            enum: ["admin", "manager", "member"],
          },
          joinedAt: {
            type: Date,
            required: true,
          },
        },
      ],
      default: [],
    },
    settings: {
      isPrivate: {
        type: Boolean,
        required: true,
      },
      allowGuestAccess: {
        type: Boolean,
        required: true,
      },
    },
  },
  { timestamps: true }
);

const Workspace = mongoose.model<WorkspaceDocument>(
  "Workspace",
  workspaceSchema
);

export default Workspace;
