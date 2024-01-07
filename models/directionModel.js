const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const accountSchema = new mongoose.Schema({
  denomination: {
    type: String,
    required: [true, "an account must have a lastName"],
  },

  agents: { type: mongoose.Schema.Types.ObjectId, ref: "Agent" },
});

accountSchema.pre("save", async function (next) {
  // will be runned if password was actually modified
  if (!this.isModified("password")) return next();

  // //   password hash function

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

accountSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
});

accountSchema.methods.correctPassword = async function (
  candidatePassword,
  accountPassword
) {
  return await bcrypt.compare(candidatePassword, accountPassword);
};

accountSchema.methods.chagedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    console.log(changedTimestamp, JWTTimestamp);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

accountSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  console.log({ resetToken }, this.passwordResetToken);
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

// declaration du model
const Account = mongoose.model("Account", accountSchema);
module.exports = Account;