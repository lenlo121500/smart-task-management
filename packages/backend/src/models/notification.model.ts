import mongoose, { Schema } from "mongoose";
import { NotificationDocument } from "../types/database.types";

const notificationSchema = new Schema<NotificationDocument>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["task_assigned", "mention", "deadline_reminder", "comment_reply"],
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    read: {
      type: Boolean,
      required: true,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.pre("save", function (next) {
  if (this.isModified("read") && this.read && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

const Notification = mongoose.model<NotificationDocument>(
  "Notification",
  notificationSchema
);

export default Notification;
