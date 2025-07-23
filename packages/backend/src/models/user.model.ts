import mongoose, { Schema } from "mongoose";
import { compareValue, hashValue } from "../utils/bcrypt.utils";
import { UserDocuments } from "../types/user.types";

const userSchema = new Schema<UserDocuments>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    isActive: {
      type: Boolean,
      required: true,
    },
    profile: {
      email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
      },
      firstName: {
        type: String,
        required: true,
      },
      lastName: {
        type: String,
        required: true,
      },
      avatar: {
        type: String,
        required: true,
      },
      timezone: {
        type: String,
        required: true,
      },
    },
    role: {
      enum: ["admin", "manager", "member"],
      type: String,
      required: true,
    },
    workspaces: {
      type: [Schema.Types.ObjectId],
      ref: "Workspace",
      required: true,
    },
    preferences: {
      notifications: {
        type: Boolean,
        required: true,
      },
      theme: {
        type: String,
        required: true,
      },
    },
    lastActive: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("passwordHash")) {
    if (this.passwordHash) {
      this.passwordHash = await hashValue(this.passwordHash);
    }
  }

  next();
});

userSchema.methods.omitPassword = function (): Omit<
  UserDocuments,
  "passwordHash"
> {
  const userObject = this.toObject();
  delete userObject.passwordHash;
  return userObject;
};

userSchema.methods.comparePassword = async function (password: string) {
  return await compareValue(password, this.passwordHash);
};

const User = mongoose.model("User", userSchema);

export default User;
