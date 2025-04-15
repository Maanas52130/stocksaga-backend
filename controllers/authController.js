const bcrypt = require('bcryptjs');
const User = require('../models/User');
const nodemailer = require('nodemailer');  // For OTP email sending

exports.signup = async (req, res) => {
  const { email, password, pin } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedPin = await bcrypt.hash(pin, 10);

    const otp = Math.floor(1000 + Math.random() * 9000).toString(); // simulate OTP

    const user = new User({
      email,
      password: hashedPassword,
      pin: hashedPin,
      otp,
      balance: 10000, // 💰 Ensure balance is explicitly initialized
    });

    await user.save();

    // Send OTP via email using nodemailer
    const transporter = nodemailer.createTransport({ 
      service: 'gmail', 
      auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
      } 
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP for Signup',
      text: `Your OTP is: ${otp}. It will expire in 10 minutes.`
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: 'Signup successful, OTP sent' });
  } catch (err) {
    res.status(500).json({ message: 'Signup failed', error: err.message });
  }
};
