require("dotenv").config();
const axios = require("axios");

module.exports = {
  checkStockPrice(stock_ticker) {
    return new Promise((resolve, reject) => {
      axios
        .get(
          `https://finnhub.io/api/v1/quote?symbol=${stock_ticker}&token=${process.env.FINNHUB_TOKEN}`
        )
        .then((result) => {
          resolve(result.data);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
};
