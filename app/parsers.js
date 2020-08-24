const config = require('config');
const $ = require('cheerio');
const Sentry = require("@sentry/node");
Sentry.init({dsn: config.sentryDsn});
const helpers = require('./helpers');


const asosFetch = async () => {
  const shopName = 'asos';
  console.log(`${shopName} scraping started...`);

  const {browser, page} = await helpers.initBrowser();

  try {
    await page.goto(config.asosUrl, {waitUntil: 'networkidle0'});

    console.log(`connected to page`);
    let showMoreBtn = await page.$('[data-auto-id="loadMoreProducts"]');
    let clickCounter = 0;
    while (showMoreBtn && clickCounter < 30) {
      await showMoreBtn.evaluate(btn => btn.click());
      console.log(`more button clicked`);
      await page.waitFor(1500);
      showMoreBtn = await page.$('[data-auto-id="loadMoreProducts"]');
      clickCounter++;
    }

    console.log(`all products loaded`);
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
    })
      .get()
      .sort((a, b) => {
        if (a.discount > b.discount) {
          return -1;
        }
        if (a.discount < b.discount) {
          return 1;
        }
        // a должно быть равным b
        return 0;
      });

    await browser.close();

    return parsedProductsList;
  } catch (e) {
    await browser.close();
    Sentry.captureException(e);
    console.log(e);
    return [];
  }

};

module.exports = {
  asosFetch
};
