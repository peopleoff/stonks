require("dotenv").config();
const { sequelize } = require("./models");
const Discord = require("discord.js");
const Sentry = require("@sentry/node");
const client = new Discord.Client();

const Tracking = require("./controllers/TrackingController");
const Stocks = require("./controllers/StocksController");

let lastCheckTime;

if (process.env.ENV !== "development") {
  Sentry.init({
    dsn:
      "https://b50315bf358b47338560dc9293c64efb@o507739.ingest.sentry.io/5599265",

    // We recommend adjusting this value in production, or using tracesSampler
    // for finer control
    tracesSampleRate: 1.0,
  });
}
sequelize.sync({ force: false }).then(() => {
  client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
  });
});

function updateLastCheckTime() {
  lastCheckTime = new Date().toLocaleTimeString();
}

async function addStock(client, msg) {
  let trackingObject = parseTracking(msg);

  if (trackingObject.error) {
    client.channels.cache
      .get(trackingObject.channel_id)
      .send(trackingObject.message);
    return;
  }

  try {
    //Check current price of stock vs users target price, if current price is lower then target price, track for decrease
    const currentPrice = await Stocks.checkStockPrice(
      trackingObject.stock_ticker
    );

    //Current price is higher, so we're tracking for an increase. otherwise track for a descrease
    if (
      Math.round(currentPrice.c * 100) <
      Math.round(trackingObject.target_price * 100)
    ) {
      trackingObject.direction = "increase";
    } else {
      trackingObject.direction = "decrease";
    }

    const addTracking = await Tracking.addTracking(trackingObject);

    client.channels.cache
      .get(trackingObject.channel_id)
      .send(
        `${addTracking.stock_ticker} is being tracked for $${addTracking.target_price}`
      );
  } catch (error) {
    client.channels.cache
      .get(trackingObject.channel_id)
      .send(`Error adding tracking`);
    console.error(error);
    Sentry.captureException(error);
  }
}

async function listTracking(client, msg) {
  try {
    const channel_id = msg.channel.id;
    const allTrackings = await Tracking.getTrackingById(channel_id);

    // inside a command, event listener, etc.
    const exampleEmbed = new Discord.MessageEmbed()
      .setColor("#0099ff")
      .setTitle("Stonks Tracker")
      .setDescription("Stocks currently being tracked")
      .setThumbnail("https://i.imgur.com/EFqRbev.png")
      .setFooter(`Last time checked ${lastCheckTime}`);

    allTrackings.forEach((tracking) => {
      let direction;
      if (tracking.direction == "increase") {
        direction = ":rocket:";
      } else {
        direction = ":coffin:";
      }
      exampleEmbed.addFields({
        name: `${tracking.dataValues.username} - ${tracking.dataValues.stock_ticker}`,
        value: `$${tracking.dataValues.target_price} ${direction} `,
      });
    });

    client.channels.cache.get(channel_id).send(exampleEmbed);
  } catch (error) {
    console.error(error);
    Sentry.captureException(error);
  }
}

function parseTracking(msg) {
  const splitMessage = msg.content.split(" ");

  if (!msg) {
    return;
  }
  const username = msg.author.username;
  const channel_id = msg.channel.id;

  //Validate input
  if (!splitMessage[1] || !splitMessage[2] || !msg) {
    return {
      channel_id: channel_id,
      error: true,
      message: "Needs stock ticker and price",
    };
  }

  //Format Input
  const stock_ticker = splitMessage[1].toUpperCase();
  const target_price = parseFloat(splitMessage[2].replace(/[^0-9.]/g, ""));

  if (isNaN(target_price)) {
    return {
      channel_id: channel_id,
      error: true,
      message: "Bad price",
    };
  }

  const trackingObject = {
    channel_id,
    stock_ticker,
    target_price,
    username,
  };
  return trackingObject;
}

async function getPrices() {
  try {
    const stocks = await Tracking.getTracking();

    //Loop through each active tracking stock
    stocks.forEach((stock) => {
      //Check price for each stock
      Stocks.checkStockPrice(stock.dataValues.stock_ticker)
        .then((result) => {
          comparePrices(result, stock.dataValues);
        })
        .catch((error) => {
          console.error(error);
          Sentry.captureException(error);
        });
    });

    //Update last time checked
    updateLastCheckTime();
  } catch (error) {
    console.error(error);
    Sentry.captureException(error);
  }
}

function comparePrices(result, stock) {
  //If current price is 0, remove invalid stock ticker
  if (result.c == 0) {
    Tracking.removeTracking(stock.id);
    return;
  }
  //Determine either tracking is looking for increase or decrease
  if (stock.direction == "increase") {
    //if current price is higher then target price
    if (Math.round(result.c * 100) > Math.round(stock.target_price * 100)) {
      //Send message to channel with prices
      const message = `:moneybag::moneybag::moneybag::moneybag:\n${stock.stock_ticker}($${result.c}) has reached your target price of $${stock.target_price}\n:moneybag::moneybag::moneybag::moneybag: `;
      //Send message to channel_id
      client.channels.cache.get(stock.channel_id).send(message);
      //Remove from tracking
      Tracking.removeTracking(stock.id);
    }
  } else {
    //if current price is lower then target price
    if (Math.round(result.c * 100) < Math.round(stock.target_price * 100)) {
      //Send message to channel with prices
      const message = `:moneybag::moneybag::moneybag::moneybag:\n${stock.stock_ticker}($${result.c}) has fallen below your target price of $${stock.target_price}\n:moneybag::moneybag::moneybag::moneybag: `;
      //Send message to channel_id
      client.channels.cache.get(stock.channel_id).send(message);
      //Remove from tracking
      Tracking.removeTracking(stock.id);
    }
  }
}

client.on("message", (msg) => {
  //Only listen for commands that start with !
  if (msg.content.substring(0, 1) !== "!") {
    return;
  }

  const command = msg.content.split(" ")[0].trim();

  switch (command) {
    case "!track":
      addStock(client, msg);
      break;
    case "!tracking":
      listTracking(client, msg);
      break;
    default:
      break;
  }
});

client.login(process.env.DISCORD_TOKEN);

setInterval(getPrices, process.env.TRACKING_MS);