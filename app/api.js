const config = require('config');
const $ = require('cheerio');
const helpers = require('./helpers');
const services = require('./services');


module.exports = (app) => {
  app.get('/asos', async (req, res) => {
    const shopName = 'asos';
    console.log(`${shopName} scraping started...`);

    const {browser, page} = await helpers.initBrowser();

    await page.goto(config.asosUrl, {waitUntil: 'load'});

    let showMoreBtn = await page.$('[data-auto-id="loadMoreProducts"]');
    while (showMoreBtn) {
      await showMoreBtn.evaluate(btn => btn.click());
      await page.waitFor(1500);
      showMoreBtn = await page.$('[data-auto-id="loadMoreProducts"]');
    }

    // Scroll back to top
    await page.evaluate(_ => {
      window.scrollTo(0, 0);
    });

    // Get the height of the rendered page
    const bodyHandle = await page.$('main');
    const {height} = await bodyHandle.boundingBox();
    await bodyHandle.dispose();

    console.log('scrolling bottom');
    // Scroll one viewport at a time, pausing to let content load
    await helpers.scrollPageToBottom(page, height);

    // Scroll back to top
    await page.evaluate(_ => {
      window.scrollTo(0, 0);
    });

    // Some extra delay to let images load
    await helpers.wait(5000);

    console.log('parsing data');
    const html = await page.content();
    const products = $('[data-auto-id="productTile"]', html);

    const parsedProductsList = $(products).map((i, p) => {
      const link = p.children[0];
      const url = link.attribs.href;
      const name = $(p.children[0].children[1]).text();
      const oldPrice = parseFloat($(p.children[0]).find('[data-auto-id="productTilePrice"] span._16nzq18').text().replace(/ /g, ''));
      const newPrice = parseFloat($(p.children[0]).find('[data-auto-id="productTileSaleAmount"]').text().replace(/ /g, ''));
      const discount = Math.floor((oldPrice - newPrice) / oldPrice * 100);
      const img = `https:${$(p).find('img')[0].attribs.src}`;
      const timestamp = Date.now();

      return {
        shop: shopName,
        name,
        oldPrice,
        newPrice,
        discount,
        img,
        url,
        timestamp,
      };
    }).get();

    await browser.close();
    const insertedProducts = await services.syncProductsCollection(parsedProductsList, shopName);
    if (req.query.sendNotification && insertedProducts.length) {
      console.log('sending telegram notification');
      await services.sendTelegramNotification(insertedProducts);
    }

    console.log('inserted products length:', insertedProducts.length);
    console.log(`${shopName} scraping finished!`);

    res.send('hello puppeteer');
  });

  app.get('/get-products', async (req, res, next) => {
    const client = await services.getMongoClient();
    const db = client.db(config.mongoDbName);
    // TODO: optimize it by paging
    const products = await db.collection(config.productsCollectionName).find().sort({
      timestamp: -1,
      discount: -1
    }).toArray();
    res.send(products);
  });
};
