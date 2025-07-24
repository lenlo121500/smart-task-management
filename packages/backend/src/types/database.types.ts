import { Document, ObjectId } from "mongoose";

export interface WorkspaceMember {
  userId: ObjectId;
  role: "admin" | "manager" | "member";
  joinedAt: Date;
}

export interface WorkspaceSettings {
  isPrivate: boolean;
  allowGuestAccess: boolean;
}

export interface WorkspaceDocument extends Document {
  _id: ObjectId;
  name: string;
  description?: string;
  owner: ObjectId;
  members: WorkspaceMember[];
  settings: WorkspaceSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentReaction {
  emoji: string;
  users: ObjectId[];
}

export interface CommentDocument extends Document {
  _id: ObjectId;
  content: string;
  author: ObjectId;
  task: ObjectId;
  mentions?: ObjectId[];
  parentComment: ObjectId | null;
  reactions?: CommentReaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityTarget {
  type: "task" | "project" | "comment";
  id: ObjectId;
}

export interface ActivityLogDocument extends Document {
  _id: ObjectId;
  actor: ObjectId;
  action: "create" | "update" | "delete" | "assign" | "comment";
  target: ActivityTarget;
  workspace: ObjectId;
  metadata?: Record<string, any>; // Optional structured object
  createdAt: Date;
}

export interface NotificationDocument extends Document {
  _id: ObjectId;
  recipient: ObjectId;
  type: "task_assigned" | "mention" | "deadline_reminder" | "comment_reply";
  title: string;
  message: string;
  data?: Record<string, any>; // Optional dynamic data
  read: boolean;
  readAt: Date | null;
  createdAt: Date;
}
