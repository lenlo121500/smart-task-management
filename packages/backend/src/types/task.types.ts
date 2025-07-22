import { ObjectId } from "mongoose";

export interface TaskAttachment {
  filename: string;
  url: string;
  uploadedBy: ObjectId;
  uploadedAt: Date;
}

export type TaskStatus = "todo" | "in-progress" | "review" | "completed";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface TaskDocument {
  _id: ObjectId;
  title: string;
  description: string;
  project: ObjectId;
  assignee: ObjectId;
  reporter: ObjectId;
  status: TaskStatus;
  priority: TaskPriority;
  labels: string[];
  dueDate: Date;
  estimatedHours: number;
  actualHours: number;
  attachments: TaskAttachment[];
  subtasks: ObjectId[];
  dependencies: ObjectId[];
  position: number;
  createdAt: Date;
  updatedAt: Date;
}
