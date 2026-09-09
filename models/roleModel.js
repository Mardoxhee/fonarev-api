const mongoose = require("mongoose");

const rolePermissionSchema = new mongoose.Schema(
  {
    module: {
      type: String,
      required: true,
      trim: true,
    },
    actions: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Le nom du rôle est obligatoire"],
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Le code du rôle est obligatoire"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    permissions: {
      type: [rolePermissionSchema],
      default: [],
    },
    active: {
      type: Boolean,
      default: true,
    },
    system: {
      type: Boolean,
      default: false,
    },
    account: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
  },
  { timestamps: true }
);

roleSchema.pre("validate", function (next) {
  if (!this.code && this.name) {
    this.code = this.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
  }
  next();
});

const Role = mongoose.model("Role", roleSchema);
module.exports = Role;
