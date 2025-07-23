import { ObjectId } from "mongoose";

export type UserRole = "admin" | "manager" | "member";

export interface UserDocuments {
  _id: ObjectId;
  username: string;
  passwordHash: string;
  isActive: boolean;
  profile: {
    email: string;
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
  createdAt: Date;
  updatedAt: Date;
}
