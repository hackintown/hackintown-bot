const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    telegramId: { type: String, required: true, unique: true },
    username: { type: String },
    spins: { type: Number, default: 3 },
    totalEarnings: { type: Number, default: 0 },
    referralCode: { type: String, unique: true },
    referredBy: { type: String },
    referredUsers: [{ type: String }],
    channelJoined: { type: Boolean, default: false },
    upiId: { type: String },
    lastSpinTime: { type: Date },
    withdrawalRequests: [
      {
        amount: Number,
        upiId: String,
        status: {
          type: String,
          enum: ["pending", "completed", "rejected"],
          default: "pending",
        },
        requestedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
