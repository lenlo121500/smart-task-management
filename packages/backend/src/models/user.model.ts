import bcrypt from "bcrypt";
import mongoose, { Schema, HydratedDocument } from "mongoose";
import { UserDocuments } from "../types/user.types";

const userSchema = new Schema<UserDocuments>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
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
    emailVerified: {
      type: Boolean,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("passwordHash")) {
    if (this.passwordHash) {
      const salt = await bcrypt.genSalt(10);
      this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    }
  }

  next();
});

userSchema.methods.omitPassword = function (
  this: HydratedDocument<UserDocuments>
) {
  const { passwordHash, ...rest } = this.toObject();
  return rest;
};

userSchema.methods.comparePassword = async function (
  this: HydratedDocument<UserDocuments>,
  password: string
) {
  return await bcrypt.compare(password, this.passwordHash);
};

const User = mongoose.model("User", userSchema);

export default User;
