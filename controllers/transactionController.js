const express = require("express");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const { getStockPrice } = require("../utils/stockUtils");
const jwt = require("jsonwebtoken");

const router = express.Router();

// ✅ Fixed Middleware to authenticate JWT properly
const authenticateJWT = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(403).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1]; // Extract token after "Bearer"

  if (!token) {
    return res.status(403).json({ message: "Invalid token format" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

// 📈 Buy/Sell transaction route
router.post("/transaction", authenticateJWT, async (req, res) => {
  const { symbol, quantity, action } = req.body;

  // Ensure symbol is valid
  if (!symbol || typeof symbol !== "string" || symbol.trim().length === 0) {
    return res.status(400).json({ message: "Invalid stock symbol." });
  }

  try {
    const priceData = await getStockPrice(symbol);
    const currentPrice = priceData.current;
    const totalCost = currentPrice * quantity;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (action === "buy") {
      if (user.balance < totalCost) {
        return res.status(400).json({ message: "Insufficient funds" });
      }

      user.balance -= totalCost;
      const stockIndex = user.portfolio.findIndex((s) => s.symbol === symbol);

      if (stockIndex >= 0) {
        const existing = user.portfolio[stockIndex];
        const totalShares = existing.quantity + quantity;
        const totalValue = (existing.price * existing.quantity) + (currentPrice * quantity);
        const avgPrice = totalValue / totalShares;

        existing.quantity = totalShares;
        existing.price = avgPrice;
      } else {
        user.portfolio.push({ symbol, quantity, price: currentPrice });
      }

    } else if (action === "sell") {
      const stockIndex = user.portfolio.findIndex((s) => s.symbol === symbol);
      if (stockIndex === -1 || user.portfolio[stockIndex].quantity < quantity) {
        return res.status(400).json({ message: "Not enough stock to sell" });
      }

      user.portfolio[stockIndex].quantity -= quantity;
      user.balance += totalCost;

      if (user.portfolio[stockIndex].quantity === 0) {
        user.portfolio.splice(stockIndex, 1);
      }
    }

    await user.save();

    const newTransaction = new Transaction({
      userId: req.user.id,
      email: user.email,
      symbol,
      quantity,
      action,
      price: currentPrice,
      totalCost,
    });

    await newTransaction.save();

    res.status(200).json({
      message: `${action} successful`,
      transaction: newTransaction,
    });
  } catch (error) {
    console.error("Transaction error:", error.message);
    res.status(500).json({ message: "Failed to process transaction" });
  }
});

// ✅ Transaction History route with filtering and sorting
router.get("/transactions/history", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      symbol,
      action,
      minQuantity,
      maxQuantity,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder = "asc",
    } = req.query;

    const query = { userId };

    if (symbol) query.symbol = symbol.toUpperCase();
    if (action) query.action = action.toLowerCase();
    if (minQuantity) query.quantity = { ...query.quantity, $gte: parseInt(minQuantity) };
    if (maxQuantity) query.quantity = { ...query.quantity, $lte: parseInt(maxQuantity) };
    if (minPrice) query.price = { ...query.price, $gte: parseFloat(minPrice) };
    if (maxPrice) query.price = { ...query.price, $lte: parseFloat(maxPrice) };

    const sortOptions = {};
    if (sortBy) {
      const allowedSortFields = ["symbol", "quantity", "price", "totalCost"];
      if (allowedSortFields.includes(sortBy)) {
        sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
      }
    }

    const transactions = await Transaction.find(query).sort(sortOptions);

    res.status(200).json({ transactions });
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    res.status(500).json({ message: "Failed to retrieve transaction history" });
  }
});

module.exports = router;
