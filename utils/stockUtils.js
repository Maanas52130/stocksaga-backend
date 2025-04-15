const axios = require("axios");

/**
 * Fetch the current stock price from Finnhub API
 */
const getStockPrice = async (symbol) => {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) throw new Error("Missing Finnhub API key.");
    if (!symbol || typeof symbol !== "string") throw new Error("Invalid symbol.");

    console.log(`🔍 Fetching stock price for: ${symbol.toUpperCase()}`);

    const response = await axios.get("https://finnhub.io/api/v1/quote", {
      params: {
        symbol: symbol.toUpperCase(),
        token: apiKey,
      },
    });

    const data = response.data;

    if (!data || typeof data.c !== "number" || data.c === 0) {
      throw new Error("Invalid response from Finnhub.");
    }

    return {
      current: data.c,
      high: data.h,
      low: data.l,
      open: data.o,
      previousClose: data.pc,
    };
  } catch (error) {
    console.error(`❌ Error fetching stock price for ${symbol}:`, error.message);
    throw new Error(`Failed to fetch stock price for symbol: ${symbol}`);
  }
};

module.exports = { getStockPrice };
