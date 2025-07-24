import { Document, ObjectId } from "mongoose";

export type UserRole = "admin" | "manager" | "member";

export interface UserDocuments extends Document {
  _id: ObjectId;
  username: string;
  email: string;
  passwordHash: string;
  isActive: boolean;
  profile: {
    firstName: string;
    lastName: string;
    avatar: string;
    timezone: string;
  };
  role: UserRole;
  workspaces: [ObjectId];
  preferences: {
    notifications: boolean;
    theme: string;
  };
  lastActive: Date;
  comparePassword(value: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}
