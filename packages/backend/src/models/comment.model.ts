import mongoose, { Schema } from "mongoose";
import { CommentDocument } from "../types/database.types";

const commentSchema = new Schema<CommentDocument>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    mentions: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    reactions: {
      type: [
        {
          emoji: {
            type: String,
            required: true,
          },
          users: [
            {
              type: Schema.Types.ObjectId,
              ref: "User",
            },
          ],
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Comment = mongoose.model<CommentDocument>("Comment", commentSchema);

export default Comment;
