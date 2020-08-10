const axios = require('axios');
const puppeteer = require('puppeteer');
const scrollPageToBottom = require('puppeteer-autoscroll-down');
const userAgent = require('user-agents');
const $ = require('cheerio');
const fs = require("fs");
const path = require('path');
const helpers = require('./helpers');
const url = 'https://www.asos.com/ru/men/rasprodazha/tufli-i-sportivnaya-obuv/cat/?cid=1935&currentpricerange=490-17990&nlid=mw|%D1%80%D0%B0%D1%81%D0%BF%D1%80%D0%BE%D0%B4%D0%B0%D0%B6%D0%B0|%D1%81%D0%BE%D1%80%D1%82%D0%B8%D1%80%D0%BE%D0%B2%D0%B0%D1%82%D1%8C%20%D0%BF%D0%BE%20%D1%82%D0%B8%D0%BF%D1%83%20%D0%BF%D1%80%D0%BE%D0%B4%D1%83%D0%BA%D1%82%D0%B0&refine=attribute_1047:8606';

module.exports = (app) => {
  app.get('/asos', async (req, res) => {
    const result = await axios(url);
    const html = result.data;
    const products = $('[data-auto-id="productTile"]', html);

    const productsData = $(products).map((i, p) => {
      const link = p.children[0];
      const url = link.attribs.href;
      const description = $(p.children[0].children[1]).text();
      const oldPrice = $(p.children[0]).find('[data-auto-id="productTilePrice"]').text();
      const newPrice = $(p.children[0]).find('[data-auto-id="productTileSaleAmount"]').text();
      // const img = $(p).find('img')[0].attribs.src.replace('//images', 'images');

      return {
        description,
        oldPrice,
        newPrice,
        // img,
        url
      };
    }).get();

    // fs.writeFileSync("parsed.txt", JSON.stringify(productsData, null, 2));
    console.log(productsData);

    res.send('hello world');
  });

  app.get('/asos-puppeteer', async (req, res) => {
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
      const description = $(p.children[0].children[1]).text();
      const oldPrice = parseFloat($(p.children[0]).find('[data-auto-id="productTilePrice"]').text().replace(/ /g, ''));
      const newPrice = parseFloat($(p.children[0]).find('[data-auto-id="productTileSaleAmount"]').text().replace(/ /g, ''));
      const img = `https:${($(p).find('img')[0].attribs.src || '')}`;

      return {
        description,
        oldPrice,
        newPrice,
        img,
        url
      };
    }).get();

    fs.writeFileSync("parsed.json", JSON.stringify(productsData, null, 2));
    console.log('products length:', productsData.length);
    console.log('without images:', productsData.filter(p => !p.img).length);

    await browser.close();
    console.log('asos scraping finished!');
    res.send('hello puppeteer');
  });

  app.get('/view-page', (req, res, next) => {
    res.sendFile(path.join(__dirname + '/../index.html'));
  });

  app.get('/get-products', (req, res, next) => {
    res.sendFile(path.join(__dirname + '/../parsed.json'));
  });
};
