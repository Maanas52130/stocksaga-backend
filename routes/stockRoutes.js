const express = require("express");
const router = express.Router();
const { getStockPriceHandler } = require("../controllers/stockController");

// Route to get live stock price
router.get("/price", getStockPriceHandler);

module.exports = router;
