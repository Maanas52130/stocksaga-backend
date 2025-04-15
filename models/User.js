const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    pin: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
    },
    balance: {
      type: Number,
      required: true,
      default: 10000, // 🪙 Initial user balance
    },
    portfolio: [
      {
        symbol: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }, // Latest price of the stock
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
