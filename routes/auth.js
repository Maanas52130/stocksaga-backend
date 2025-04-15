const express = require('express');
const router = express.Router();
const { signup } = require('../controllers/authController');

// User signup route
router.post('/signup', signup);

// You can add other routes related to login, OTP verification, etc.
// Example:
router.post('/login', login); // Add a login controller and route

module.exports = router;
