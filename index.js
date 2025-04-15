const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const User = require("./models/User");
const stockRoutes = require("./routes/stockRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const userRoutes = require("./routes/userRoutes"); // ✅ Add userRoutes

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

const pendingVerifications = {}; // Required for OTP flow

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("MongoDB connection failed:", err));

// Email Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// JWT Middleware
const authenticateJWT = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(403).json({ message: "Access denied" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
};

// OTP Helper
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
}

// Signup Route
app.post("/signup", async (req, res) => {
  const { email, password, pin } = req.body;

  try {
    const normalizedEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const otp = generateOTP();
    const hashedPassword = await bcrypt.hash(password, 10);

    pendingVerifications[normalizedEmail] = {
      hashedPassword,
      pin,
      otp,
      createdAt: Date.now(),
    };

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: normalizedEmail,
      subject: "Your StockSaga OTP",
      html: `<h3>Your OTP is: <b>${otp}</b></h3>`,
    });

    res.status(201).json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error during signup" });
  }
});

// OTP Verification Route
app.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  try {
    const normalizedEmail = email.toLowerCase();
    const pending = pendingVerifications[normalizedEmail];

    if (!pending) {
      return res.status(400).json({ message: "No signup request found" });
    }

    if (Date.now() - pending.createdAt > 600000) {
      delete pendingVerifications[normalizedEmail];
      return res.status(400).json({ message: "OTP expired" });
    }

    if (pending.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const newUser = new User({
      email: normalizedEmail,
      password: pending.hashedPassword,
      pin: pending.pin,
    });

    await newUser.save();
    delete pendingVerifications[normalizedEmail];

    return res.status(200).json({ message: "OTP verified and account created" });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ message: "Server error during OTP verification" });
  }
});

// Login Route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// Mount Routes
app.use("/api/stocks", stockRoutes);
app.use("/api", transactionRoutes);
app.use("/api/user", userRoutes); // ✅ Mount user routes at /api/user

// Start Server
app.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});
