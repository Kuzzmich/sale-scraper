const axios = require('axios');
const puppeteer = require('puppeteer');
const scrollPageToBottom = require('puppeteer-autoscroll-down');
const userAgent = require('user-agents');
const $ = require('cheerio');
const fs = require("fs");
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const helpers = require('./helpers');
const url = 'https://www.asos.com/ru/men/rasprodazha/tufli-i-sportivnaya-obuv/cat/?cid=1935&currentpricerange=490-17990&nlid=mw|%D1%80%D0%B0%D1%81%D0%BF%D1%80%D0%BE%D0%B4%D0%B0%D0%B6%D0%B0|%D1%81%D0%BE%D1%80%D1%82%D0%B8%D1%80%D0%BE%D0%B2%D0%B0%D1%82%D1%8C%20%D0%BF%D0%BE%20%D1%82%D0%B8%D0%BF%D1%83%20%D0%BF%D1%80%D0%BE%D0%B4%D1%83%D0%BA%D1%82%D0%B0&refine=attribute_1047:8606';
const mongoConn = 'mongodb+srv://admin:Kuzzmich26rus@cluster0.1twre.mongodb.net/sale-products?retryWrites=true&w=majority';
const mongoDbName = 'sale-products';
const mongoCollectionName = 'products';

module.exports = (app) => {
  app.get('/asos', async (req, res) => {
    console.log('asos scraping started...');

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setUserAgent(userAgent.toString());
    await page.goto(url, {waitUntil: 'load'});

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
    const viewportHeight = page.viewport().height;
    let viewportIncr = 0;
    while (viewportIncr + viewportHeight < height) {
      await page.evaluate(_viewportHeight => {
        window.scrollBy(0, _viewportHeight);
      }, viewportHeight);
      await page.waitFor(200);
      viewportIncr = viewportIncr + viewportHeight;
    }

    // Scroll back to top
    await page.evaluate(_ => {
      window.scrollTo(0, 0);
    });

    // Some extra delay to let images load
    await helpers.wait(5000);

    console.log('parsing data');
    const html = await page.content();
    const products = $('[data-auto-id="productTile"]', html);

    const productsData = $(products).map((i, p) => {
      const link = p.children[0];
      const url = link.attribs.href;
      const name = $(p.children[0].children[1]).text();
      const oldPrice = parseFloat($(p.children[0]).find('[data-auto-id="productTilePrice"] span._16nzq18').text().replace(/ /g, ''));
      const newPrice = parseFloat($(p.children[0]).find('[data-auto-id="productTileSaleAmount"]').text().replace(/ /g, ''));
      const discount = Number((oldPrice - newPrice) / oldPrice * 100).toFixed(0);
      const img = `https:${($(p).find('img')[0].attribs.src || '')}`;
      const timestamp = Date.now();

      return {
        shop: 'asos',
        name,
        oldPrice,
        newPrice,
        discount,
        img,
        url,
        timestamp,
      };
    }).get();

    // TODO: compare new data with existing by url
    // TODO: show last updated data earlier
    // TODO: upload to mongo only new products
    // TODO: move constants to config
    const client = await MongoClient.connect(mongoConn, {useNewUrlParser: true});
    const db = client.db(mongoDbName);
    await db.collection(mongoCollectionName).insertMany(productsData);
    await client.close();

    console.log('products length:', productsData.length);
    console.log('without images:', productsData.filter(p => !p.img).length);

    await browser.close();
    console.log('asos scraping finished!');
    res.send('hello puppeteer');
  });

  app.get('/get-products', (req, res, next) => {
    res.sendFile(path.join(__dirname + '/../parsed.json'));
  });
};
