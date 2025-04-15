const { getStockPrice } = require("../utils/stockUtils");

const getStockPriceHandler = async (req, res) => {
  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: "Stock symbol is required." });
  }

  try {
    const priceData = await getStockPrice(symbol);

    console.log("✅ Sending price data:", priceData);

    // Ensure key name is "price" to match frontend usage
    return res.status(200).json({ price: priceData.current });
  } catch (error) {
    console.error("❌ Error in stockController:", error.message);
    return res.status(500).json({ error: "Failed to fetch stock price." });
  }
};

module.exports = { getStockPriceHandler };
  