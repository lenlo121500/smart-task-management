import mongoose, { Schema } from "mongoose";
import { TaskDocument } from "../types/task.types";

const taskSchema = new Schema<TaskDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reporter: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["todo", "in-progress", "review", "completed"],
    },
    priority: {
      type: String,
      required: true,
      enum: ["low", "medium", "high", "urgent"],
    },
    labels: {
      type: [String],
      default: [],
    },
    dueDate: {
      type: Date,
      required: true,
    },
    estimatedHours: {
      type: Number,
      required: true,
    },
    actualHours: {
      type: Number,
      default: 0,
    },
    attachments: {
      type: [
        {
          filename: String,
          url: String,
          uploadedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },

    subtasks: {
      type: [Schema.Types.ObjectId],
      ref: "Task",
      default: [],
    },
    dependencies: {
      type: [Schema.Types.ObjectId],
      ref: "Task",
      default: [],
    },
    position: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.index({ project: 1, position: 1 });
taskSchema.index({ assignee: 1 });
taskSchema.index({ status: 1 });

const Task = mongoose.model<TaskDocument>("Task", taskSchema);

export default Task;
