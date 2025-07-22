import { ObjectId } from "mongoose";

export type UserRole = "admin" | "manager" | "member";

export interface UserDocuments {
  _id: ObjectId;
  username: String;
  passwordHash: String;
  profile: {
    firstName: String;
    lastName: String;
    avatar: String;
    timezone: String;
  };
  role: UserRole;
  workspaces: [ObjectId];
  preferences: {
    notifications: Boolean;
    theme: String;
  };
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}
