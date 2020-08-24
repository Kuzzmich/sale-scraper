const config = require('config');
const $ = require('cheerio');
const parsers = require('./parsers');
const helpers = require('./helpers');
const services = require('./services');
const telegramMessageQueue = require('./queues/telegramQueue');


const asos = async (sendNotification) => {
  const parsedProductsList = await parsers.asosFetch();
  const insertedProducts = await services.syncProductsCollection(parsedProductsList);

  if (sendNotification && insertedProducts.length) {
    console.log('sending telegram notification');
    for (let i = 0, j = insertedProducts.length, f = 0; i < j; i += 10, f++) {
      telegramMessageQueue.add(
        {products: insertedProducts.slice(i, i + 10)},
        {backoff: 61000, attemps: 1, removeOnComplete: true, removeOnFail: true}
      );
    }
  }

  console.log('inserted products length:', insertedProducts.length);
  console.log(`ASOS scraping finished!`);
};

module.exports = {
  asos
};
