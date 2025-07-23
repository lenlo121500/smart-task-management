import { UserDocuments } from "../types/user.types";

declare global {
  namespace Express {
    interface Request {
      user?: UserDocuments;
      token?: string;
    }
  }
}
