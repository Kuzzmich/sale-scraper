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

const asos = async (sendNotification) => {
  const parsedProductsList = await parsers.asosFetch();
  const insertedProducts = await services.syncProductsCollection(parsedProductsList);

  if (sendNotification && insertedProducts.length) {
    await sendNotifications(insertedProducts);
  }

  console.log(`${getTime()} - inserted products length: ${insertedProducts.length}`);
  console.log(`${getTime()} - ASOS scraping finished!`);
};

const endClothing = async (sendNotification) => {
  const parsedProductsList = await parsers.endClothingFetch();
  const insertedProducts = await services.syncProductsCollection(parsedProductsList);

  if (sendNotification && insertedProducts.length) {
    await sendNotifications(insertedProducts);
  }

  console.log(`${getTime()} - inserted products length: ${insertedProducts.length}`);
  console.log(`${getTime()} - END CLOTHING scraping finished!`);
};

const yoox = async (sendNotification) => {
  const parsedProductsList = await parsers.yooxFetch();
  const insertedProducts = await services.syncProductsCollection(parsedProductsList);

  if (sendNotification && insertedProducts.length) {
    await sendNotifications(insertedProducts);
  }

  console.log(`${getTime()} - inserted products length: ${insertedProducts.length}`);
  console.log(`${getTime()} - YOOX scraping finished!`);
};

module.exports = {
  asos,
  endClothing,
  yoox,
};
