const User = require("../models/User");

exports.getPortfolio = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("balance portfolio");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      balance: user.balance,
      portfolio: user.portfolio,
    });
  } catch (error) {
    console.error("❌ Error fetching portfolio:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 🔐 Verify Trading PIN
exports.verifyTradingPin = async (req, res) => {
  const { pin } = req.body;
  const userId = req.user.id;

  if (!pin) {
    return res.status(400).json({ message: "Trading PIN is required" });
  }

  try {
    const user = await User.findById(userId);

    if (!user || user.pin !== pin) {
      return res.status(401).json({ message: "Incorrect Trading PIN" });
    }

    return res.status(200).json({ message: "PIN verified successfully" });
  } catch (error) {
    console.error("Error verifying PIN:", error);
    return res.status(500).json({ message: "Server error verifying PIN" });
  }
};
