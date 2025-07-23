import { Request, Response, NextFunction } from "express";
import { APIError } from "../utils/APIError.utils";

export enum Permission {
  // Project permissions
  PROJECT_CREATE = "project:create",
  PROJECT_READ = "project:read",
  PROJECT_UPDATE = "project:update",
  PROJECT_DELETE = "project:delete",

  // Task permissions
  TASK_CREATE = "task:create",
  TASK_READ = "task:read",
  TASK_UPDATE = "task:update",
  TASK_DELETE = "task:delete",
  TASK_ASSIGN = "task:assign",

  // User management
  USER_INVITE = "user:invite",
  USER_REMOVE = "user:remove",
  USER_UPDATE_ROLE = "user:update_role",

  // Analytics
  ANALYTICS_READ = "analytics:read",
  ANALYTICS_EXPORT = "analytics:export",

  // Admin
  ADMIN_ALL = "admin:all",
}

// Role-based permission matrix
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: Object.values(Permission), // full access
  manager: [
    Permission.PROJECT_CREATE,
    Permission.PROJECT_READ,
    Permission.PROJECT_UPDATE,
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
    Permission.TASK_ASSIGN,
    Permission.USER_INVITE,
    Permission.ANALYTICS_READ,
    Permission.ANALYTICS_EXPORT,
  ],
  member: [
    Permission.PROJECT_READ,
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_UPDATE,
    Permission.ANALYTICS_READ,
  ],
};

// Middleware to enforce permissions
export const requirePermission = (permission: Permission) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return next(new APIError("Authentication required", 401));
    }

    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    const hasPermission =
      userPermissions.includes(permission) ||
      userPermissions.includes(Permission.ADMIN_ALL);

    if (!hasPermission) {
      return next(new APIError("Permission denied", 403));
    }

    return next();
  };
};
