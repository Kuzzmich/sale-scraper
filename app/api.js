const config = require('config');
const scrapingQueue = require('./queues/scrapingQueue');
const services = require('./services');
const scraper = require('./scraper');


module.exports = (app) => {
  app.get('/asos', async (req, res) => {
    await scraper.scrapeData('asos', true);
    res.send('hello puppeteer');
  });

  app.get('/end-clothing', async (req, res) => {
    await scraper.scrapeData('endClothing',true);
    res.send('hello puppeteer');
  });

  app.get('/yoox', async (req, res) => {
    await scraper.scrapeData('yoox',false);
    res.send('hello puppeteer');
  });

  app.get('/farfetch', async (req, res) => {
    await scraper.scrapeData('farfetch',false);
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
    const count = 100;
    // TODO: optimize it by paging
    const products = await db.collection(config.productsCollectionName).find().limit(count).sort({
      timestamp: -1,
      discount: -1
    }).toArray();
    await client.close();
    res.send(products);
  });
};
