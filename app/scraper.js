const { getTime } = require('./helpers');
const parsers = require('./parsers');
const services = require('./services');
const telegramMessageQueue = require('./queues/telegramQueue');


const sendNotifications = async (insertedProducts) => {
  console.log(`${getTime()} - sending telegram notification`);
    for (let i = 0, j = insertedProducts.length, f = 0; i < j; i += 10, f++) {
      telegramMessageQueue.add(
        {products: insertedProducts.slice(i, i + 10)},
        {backoff: 61000, attemps: 1, removeOnComplete: true, removeOnFail: true}
      );
    }
};

const scrapeData = async (parserName, sendNotification) => {
  const parsedProductsList = await parsers[parserName]();
  const insertedProducts = await services.syncProductsCollection(parsedProductsList);

  if (sendNotification && insertedProducts.length) {
    await sendNotifications(insertedProducts);
  }

  console.log(`${getTime()} - inserted products length: ${insertedProducts.length}`);
  console.log(`${getTime()} - ${parserName.toUpperCase()} scraping finished!`);
};

module.exports = {
  scrapeData,
  parsersList: Object.keys(parsers)
};
