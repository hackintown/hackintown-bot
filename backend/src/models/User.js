const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  username: { type: String },
  spins: { type: Number, default: 3 },
  totalEarnings: { type: Number, default: 0 },
  referredBy: { type: String },
  referredUsers: { type: [String], default: [] },
  upiId: { type: String },
});

module.exports = mongoose.model("User", UserSchema);
