const express = require("express");
const router = express.Router();
const { getPortfolio, verifyTradingPin } = require("../controllers/userController");
const authenticateJWT = require("../middleware/authenticateJWT");

// GET /api/user/portfolio
router.get("/portfolio", authenticateJWT, getPortfolio);

// POST /api/user/verify-pin
router.post("/verify-pin", authenticateJWT, verifyTradingPin);

module.exports = router;
