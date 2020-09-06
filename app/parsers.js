const config = require('config');
const $ = require('cheerio');
const Sentry = require("@sentry/node");
Sentry.init({dsn: config.sentryDsn});
const helpers = require('./helpers');
const getTime = helpers.getTime;


const asosFetch = async () => {
  const shopName = 'asos';
  console.log(`${getTime()} - ${shopName} scraping started...`);

  const {browser, page} = await helpers.initBrowser();

  try {
    await page.goto(config.asosUrl, {waitUntil: 'networkidle0', timeout: 60000});

    console.log(`${getTime()} - connected to page`);
    let showMoreBtn = await page.$('[data-auto-id="loadMoreProducts"]');
    let clickCounter = 0;
    while (showMoreBtn && clickCounter < 30) {
      await showMoreBtn.evaluate(btn => btn.click());
      console.log(`${getTime()} - more button clicked`);
      await page.waitFor(1500);
      showMoreBtn = await page.$('[data-auto-id="loadMoreProducts"]');
      clickCounter++;
    }

    console.log(`${getTime()} - all products loaded`);
    // Scroll back to top
    await page.evaluate(_ => {
      window.scrollTo(0, 0);
    });

    // Get the height of the rendered page
    const bodyHandle = await page.$('main');
    const {height} = await bodyHandle.boundingBox();
    await bodyHandle.dispose();

    console.log(`${getTime()} - scrolling bottom`);
    // Scroll one viewport at a time, pausing to let content load
    await helpers.scrollPageToBottom(page, height);

    // Scroll back to top
    await page.evaluate(_ => {
      window.scrollTo(0, 0);
    });

    // Some extra delay to let images load
    await helpers.wait(5000);

    console.log(`${getTime()} - parsing data`);
    const html = await page.content();
    const products = $('[data-auto-id="productTile"]', html);
    await browser.close();

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
      .filter(p => p.discount >= 20)
      .sort((a, b) => {
        if (a.discount > b.discount) {
          return -1;
        }
        if (a.discount < b.discount) {
          return 1;
        }
        return 0;
      });

    return parsedProductsList;
  } catch (e) {
    await browser.close();
    Sentry.captureException(e);
    console.log(e);
    return [];
  }

};

const endClothingFetch = async () => {
  const shopName = 'end clothing';
  console.log(`${shopName} scraping started...`);

  const {browser, page} = await helpers.initBrowser();

  try {
    await page.goto(config.endClothingUrl, {waitUntil: 'load', timeout: 60000});

    console.log(`${getTime()} - connected to page`);
    let showMoreBtn = await page.$('.sc-1j0b8up-0.Xpmnl');
    let clickCounter = 0;
    while (showMoreBtn && clickCounter < 30) {
      await showMoreBtn.evaluate(btn => btn.click());
      console.log(`${getTime()} - more button clicked`);
      await page.waitFor(1500);
      showMoreBtn = await page.$('.sc-1j0b8up-0.Xpmnl');
      clickCounter++;
    }

    console.log(`${getTime()} - all products loaded`);
    // Scroll back to top
    await page.evaluate(_ => {
      window.scrollTo(0, 0);
    });

    // Get the height of the rendered page
    const bodyHandle = await page.$('#app-container');
    const {height} = await bodyHandle.boundingBox();
    await bodyHandle.dispose();

    console.log(`${getTime()} - scrolling bottom`);
    // Scroll one viewport at a time, pausing to let content load
    await helpers.scrollPageToBottom(page, height);

    // Scroll back to top
    await page.evaluate(_ => {
      window.scrollTo(0, 0);
    });

    // Some extra delay to let images load
    await helpers.wait(5000);

    console.log(`${getTime()} - parsing data`);
    const html = await page.content();
    const products = $('.sc-1koxpgo-0.bTJixI.sc-5sgtnq-2.gHSLMJ', html);
    await browser.close();

    const parsedProductsList = $(products).map((i, p) => {
      const endClothingDomen = 'https://www.endclothing.com';

      const url = endClothingDomen + $(p).attr('href');
      const name = $(p).find('.sc-5sgtnq-3.dMAnEc').text().trim();
      const oldPrice = parseFloat($(p).find('[data-test="ProductCard__ProductFullPrice"]').text().trim().replace('RUB', '').replace(',', ''));
      const newPrice = parseFloat($(p).find('[data-test="ProductCard__ProductFinalPrice"]').text().trim().replace('RUB', '').replace(',', ''));
      const discount = Math.floor((oldPrice - newPrice) / oldPrice * 100);
      const img = $(p).find('.sc-1i8wfdy-0.iKFnmr.sc-5sgtnq-0.gHSKWP').attr('src');
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
      .filter(p => p.discount >= 20)
      .sort((a, b) => {
        if (a.discount > b.discount) {
          return -1;
        }
        if (a.discount < b.discount) {
          return 1;
        }
        return 0;
      });

    return parsedProductsList;
  } catch (e) {
    await browser.close();
    Sentry.captureException(e);
    console.log(e);
    return [];
  }

};

const yooxFetch = async () => {
  const shopName = 'yoox';
  console.log(`${getTime()} - ${shopName} scraping started...`);

  const {browser, page} = await helpers.initBrowser();

  try {
    await page.goto(config.yooxUrl, {
      waitUntil: [
        'load',
        'domcontentloaded',
        'networkidle0',
        'networkidle2'
      ],
      timeout: 60000
    });

    console.log(`${getTime()} - connected to page`);
    const moreBtnSelector = '.pure-menu-item.nextPage';
    const productNodes = [];
    let showMoreBtn = await page.$(moreBtnSelector);
    let clickCounter = 0;
    // TODO: refactor it
    do {
      await page.evaluate(_ => {
        window.scrollTo(0, 0);
      });

      // Get the height of the rendered page
      const bodyHandle = await page.$('#itemsGrid');
      const {height} = await bodyHandle.boundingBox();
      await bodyHandle.dispose();

      console.log(`${getTime()} - scrolling bottom`);
      // Scroll one viewport at a time, pausing to let content load
      await helpers.scrollPageToBottom(page, height);

      // Scroll back to top
      await page.evaluate(_ => {
        window.scrollTo(0, 0);
      });

      // Some extra delay to let images load
      await helpers.wait(5000);

      console.log(`${getTime()} - parsing data`);
      const html = await page.content();
      const products = $('.itemContainer', html).get();
      productNodes.push(...products);

      showMoreBtn = await page.$(moreBtnSelector);
      clickCounter++;
      if (showMoreBtn) {
        await showMoreBtn.evaluate(btn => btn.click());
        console.log(`${getTime()} - more button clicked`);
        await page.waitFor(3000);
      }
    } while (showMoreBtn && clickCounter < 30);

    console.log(`${getTime()} - all products loaded`);
    // Scroll back to top
    await browser.close();

    const parsedProductsList = $(productNodes).map((i, p) => {
      const endClothingDomen = 'https://www.yoox.com';

      const url = endClothingDomen + $(p).find('a.itemlink').attr('href');
      const brand = $(p).find('.brand').text().trim();
      const title = $(p).find('.title').text().trim();
      const name = `${brand} ${title}`;
      const oldPrice = parseFloat($(p).find('span.oldprice').text().trim().replace('руб', '').replace(' ', '') || 0);
      const newPrice = parseFloat($(p).find('span.newprice').text().trim().replace('руб', '').replace(' ', '') || 0);
      let discount = 0;
      if (oldPrice && newPrice) discount = Math.floor((oldPrice - newPrice) / oldPrice * 100);
      const img = $(p).find('img.front').attr('src');
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
      .filter(p => p.discount >= 20)
      .sort((a, b) => {
        if (a.discount > b.discount) {
          return -1;
        }
        if (a.discount < b.discount) {
          return 1;
        }
        return 0;
      });

    return parsedProductsList;
  } catch (e) {
    await browser.close();
    Sentry.captureException(e);
    console.log(e);
    return [];
  }

};

module.exports = {
  asosFetch,
  endClothingFetch,
  yooxFetch
};
