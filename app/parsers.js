const config = require('config');
const $ = require('cheerio');
const _ = require('lodash');
const Sentry = require("@sentry/node");
Sentry.init({dsn: config.sentryDsn});
const helpers = require('./helpers');
const getTime = helpers.getTime;


const asos = async () => {
  const shopName = 'asos';
  console.log(`${getTime()} - ${shopName.toUpperCase()} scraping started...`);

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

    let parsedProductsList = $(products).map((i, p) => {
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
    parsedProductsList = _.uniqBy(parsedProductsList, 'url');

    return parsedProductsList;
  } catch (e) {
    await browser.close();
    Sentry.captureException(e);
    console.log(e);
    return [];
  }

};

const endClothing = async () => {
  const shopName = 'end clothing';
  console.log(`${getTime()} - ${shopName.toUpperCase()} scraping started...`);

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

    let parsedProductsList = $(products).map((i, p) => {
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
    parsedProductsList = _.uniqBy(parsedProductsList, 'url');

    return parsedProductsList;
  } catch (e) {
    await browser.close();
    Sentry.captureException(e);
    console.log(e);
    return [];
  }

};

const yoox = async () => {
  const shopName = 'yoox';
  console.log(`${getTime()} - ${shopName.toUpperCase()} scraping started...`);

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

    let parsedProductsList = $(productNodes).map((i, p) => {
      const endClothingDomain = 'https://www.yoox.com';

      const url = endClothingDomain + $(p).find('a.itemlink').attr('href');
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
    parsedProductsList = _.uniqBy(parsedProductsList, 'url');

    return parsedProductsList;
  } catch (e) {
    await browser.close();
    Sentry.captureException(e);
    console.log(e);
    return [];
  }

};

const farfetch = async () => {
  const shopName = 'farfetch';
  console.log(`${getTime()} - ${shopName.toUpperCase()} scraping started...`);

  const {browser, page} = await helpers.initBrowser();

  try {
    await page.goto(config.farfetchUrl, {
      waitUntil: [
        'load',
        'domcontentloaded',
        'networkidle0',
        'networkidle2'
      ],
      timeout: 60000
    });

    console.log(`${getTime()} - connected to page`);
    const moreBtnSelector = '._cc1815._b4b5fa._e7b42f:not(._a0a0a4)';
    const productNodes = [];
    let showMoreBtn = null;
    let clickCounter = 0;

    do {
      await page.evaluate(_ => {
        window.scrollTo(0, 0);
      });

      // Get the height of the rendered page
      const bodyHandle = await page.$('[data-test="product-card-list"]');
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
      const products = $('[data-test="productCard"]', html).get();
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

    let parsedProductsList = $(productNodes).map((i, p) => {
      const farfetchDomain = 'https://www.farfetch.com';

      const url = farfetchDomain + $(p).find('a._5ce6f6').attr('href');
      const brand = $(p).find('[data-test="productDesignerName"]').text().trim();
      const title = $(p).find('[data-test="productDescription"]').text().trim();
      const name = `${brand} ${title}`;
      const oldPrice = parseFloat($(p).find('[data-test="initialPrice"]').text().trim().replace(/ |₽|[^\x00-\x7F]/g, '') || 0);
      const newPrice = parseFloat($(p).find('[data-test="price"]').text().trim().replace(/ |₽|[^\x00-\x7F]/g, '') || 0);
      let discount = 0;
      if (oldPrice && newPrice) discount = Math.floor((oldPrice - newPrice) / oldPrice * 100);
      const img = $(p).find('img[itemprop="image"]').attr('src');
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
      .filter(p => p.discount >= 20 && p.newPrice <= 15000)
      .sort((a, b) => {
        if (a.discount > b.discount) {
          return -1;
        }
        if (a.discount < b.discount) {
          return 1;
        }
        return 0;
      });
    parsedProductsList = _.uniqBy(parsedProductsList, 'url');

    return parsedProductsList;
  } catch (e) {
    await browser.close();
    Sentry.captureException(e);
    console.log(e);
    return [];
  }

};

const lamoda = async () => {
  const shopName = 'lamoda';
  console.log(`${getTime()} - ${shopName.toUpperCase()} scraping started...`);

  const {browser, page} = await helpers.initBrowser();

  try {
    await page.goto(config.lamodaUrl, {
      waitUntil: [
        'load',
        'domcontentloaded',
        'networkidle0',
        'networkidle2'
      ],
      timeout: 60000
    });

    console.log(`${getTime()} - connected to page`);
    const moreBtnSelector = 'span.paginator__next';
    const productNodes = [];
    let showMoreBtn = null;
    let clickCounter = 0;

    do {
      await page.evaluate(_ => {
        window.scrollTo(0, 0);
      });

      // Get the height of the rendered page
      const bodyHandle = await page.$('#vue-root');
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
      const products = $('.products-list-item', html).get();
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

    let parsedProductsList = $(productNodes).map((i, p) => {
      const lamodaDomain = 'https://www.lamoda.ru';

      const url = lamodaDomain + $(p).find('a.products-list-item__link').attr('href');
      const name = $(p).find('.products-list-item__brand').text().replace(/\n/g, '').split(' ').filter(s => s).join(' ');
      const oldPrice = parseFloat($(p).find('.price__old').text().trim().replace(/ /g, '') || 0);
      const newPrice = parseFloat($(p).find('.price__new').text().trim().replace(/ /g, '') || 0);
      let discount = 0;
      if (oldPrice && newPrice) discount = Math.floor((oldPrice - newPrice) / oldPrice * 100);
      const img = `https:${$(p).attr('data-src')}`;
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
      .filter(p => p.discount >= 20 && p.newPrice <= 15000)
      .sort((a, b) => {
        if (a.discount > b.discount) {
          return -1;
        }
        if (a.discount < b.discount) {
          return 1;
        }
        return 0;
      });
    parsedProductsList = _.uniqBy(parsedProductsList, 'url');

    return parsedProductsList;
  } catch (e) {
    await browser.close();
    Sentry.captureException(e);
    console.log(e);
    return [];
  }
};

const rendezVous = async () => {
  const shopName = 'rendez vous';
  console.log(`${getTime()} - ${shopName.toUpperCase()} scraping started...`);

  const {browser, page} = await helpers.initBrowser();

  try {
    await page.goto(config.rendezVousUrl, {
      waitUntil: [
        'load',
        'domcontentloaded',
        'networkidle0',
        'networkidle2'
      ],
      timeout: 60000
    });

    console.log(`${getTime()} - connected to page`);
    const moreBtnSelector = 'li.next > a.js-rv-link';
    const productNodes = [];
    let showMoreBtn = null;
    let clickCounter = 0;

    do {
      await page.evaluate(_ => {
        window.scrollTo(0, 0);
      });

      // Get the height of the rendered page
      const bodyHandle = await page.$('main#content');
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
      const products = $('li.item', html).get();
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

    let parsedProductsList = $(productNodes).map((i, p) => {
      const rendezDomain = 'https://stavropol.rendez-vous.ru';

      const url = rendezDomain + $(p).find('a.item-link').attr('href');
      const name = $(p).find('.item-name').text().replace(/\n/g, '').split(' ').filter(s => s).join(' ');
      const oldPrice = parseFloat($(p).find('.item-price-old > .item-price-value').attr('content') || 0);
      const newPrice = parseFloat($(p).find('.item-price-new > .item-price-value').attr('content') || 0);
      let discount = 0;
      if (oldPrice && newPrice) discount = Math.floor((oldPrice - newPrice) / oldPrice * 100);
      const img = $(p).find('img.item-image-thumbnail').attr('src');
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
      .filter(p => p.discount >= 20 && p.newPrice <= 15000)
      .sort((a, b) => {
        if (a.discount > b.discount) {
          return -1;
        }
        if (a.discount < b.discount) {
          return 1;
        }
        return 0;
      });
    parsedProductsList = _.uniqBy(parsedProductsList, 'url');

    return parsedProductsList;
  } catch (e) {
    await browser.close();
    Sentry.captureException(e);
    console.log(e);
    return [];
  }
};

module.exports = {
  asos,
  endClothing,
  yoox,
  farfetch,
  lamoda,
  rendezVous
};
