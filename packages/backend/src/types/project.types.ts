import { ObjectId } from "mongoose";

export type ProjectStatus = "active" | "completed" | "archived";
export type ProjectPriority = "low" | "medium" | "high" | "urgent";

export interface ProjectDocument {
  _id: ObjectId;
  name: string;
  description?: string;
  workspace: ObjectId; // Reference to the workspace
  owner: ObjectId; // Reference to the user
  members: ObjectId[]; // Reference to the users
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: Date;
  dueDate: Date;
  tags?: string[];
  progress: number; // e.g., 0–100 or calculated dynamically
  createdAt: Date;
  updatedAt: Date;
}
