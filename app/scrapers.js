const config = require('config');
const $ = require('cheerio');
const parsers = require('./parsers');
const helpers = require('./helpers');
const services = require('./services');
const telegramMessageQueue = require('./queues/telegramQueue');


const asos = async (sendNotification) => {
  /*const parsedProductsList = await parsers.asosFetch();
  const insertedProducts = await services.syncProductsCollection(parsedProductsList);*/
  const insertedProducts = [
    {
      "url": "https://www.asos.com/ru/nike/cherno-belye-krossovki-nike-renew-lucent/prd/21412462?clr=chernyj-belyj&colourwayid=60164838&SearchQuery=&cid=1935",
      "discount": 1,
      "img": "https://images.asos-media.com/products/cherno-belye-krossovki-nike-renew-lucent/21412462-1-blackwhite?$n_480w$&wid=476&fit=constrain",
      "name": "Черно-белые кроссовки Nike Renew Lucent",
      "newPrice": 5590,
      "oldPrice": 5690,
      "shop": "asos",
      "timestamp": 1597856447886.0
    }
  ]

  if (sendNotification && insertedProducts.length) {
    console.log('sending telegram notification');
    for (let i = 0, j = insertedProducts.length, f = 0; i < j; i += 10, f++) {
      telegramMessageQueue.add(
        {products: insertedProducts.slice(i, i + 10)},
        {delay: 61000 * f, backoff: 61000, attemps: 5}
      );
    }
  }

  console.log('inserted products length:', insertedProducts.length);
  console.log(`ASOS scraping finished!`);
};

module.exports = {
  asos
};
