import mongoose, { Schema } from "mongoose";
import { ActivityLogDocument } from "../types/database.types";

const activitySchema = new Schema<ActivityLogDocument>(
  {
    actor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: ["create", "update", "delete", "assign", "comment"],
    },
    target: {
      type: {
        type: String,
        required: true,
        enum: ["task", "project", "comment"],
      },
      id: {
        type: Schema.Types.ObjectId,
        required: true,
      },
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

const ActivityLog = mongoose.model<ActivityLogDocument>(
  "ActivityLog",
  activitySchema
);

export default ActivityLog;
