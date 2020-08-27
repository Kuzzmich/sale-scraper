const config = require('config');
const scrapingQueue = require('./queues/scrapingQueue');
const services = require('./services');
const scrapers = require('./scrapers');


module.exports = (app) => {
  app.get('/asos', async (req, res) => {
    await scrapers.asos(true);
    res.send('hello puppeteer');
  });

  app.get('/restart-scraping', async (req, res) => {
    await scrapingQueue.queue.pause();
    await scrapingQueue.queue.empty();
    await scrapingQueue.queue.resume();
    scrapingQueue.startScraping();

    res.send('scraping restarted');
  });

  app.get('/get-products', async (req, res, next) => {
    const client = await services.getMongoClient();
    const db = client.db(config.mongoDbName);
    // TODO: optimize it by paging
    const products = await db.collection(config.productsCollectionName).find().sort({
      timestamp: -1,
      discount: -1
    }).toArray();
    await client.close();
    res.send(products);
  });
};
