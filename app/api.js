const config = require('config');
const scrapingQueue = require('./queues/scrapingQueue');
const services = require('./services');
const scraper = require('./scraper');


module.exports = (app) => {
  app.get('/parse/:parserName', async (req, res) => {
    const parserName = req.params.parserName;
    await scraper.scrapeData(parserName, true);
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
    const page = parseInt(req.query.page || 0);
    const query = req.query.q || '';
    const searchQuery = {};
    if (query) {
      searchQuery.name = {
        $regex: `.*${query}.*`,
        $options: 'i'
      };
    }

    const products = await db.collection(config.productsCollectionName).find(searchQuery).limit(count).skip(100 * page).sort({
      timestamp: -1,
      discount: -1
    }).toArray();
    await client.close();
    res.send(products);
  });
};
