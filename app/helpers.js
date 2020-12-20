const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { PuppeteerBlocker } = require('@cliqz/adblocker-puppeteer');
const fetch = require('cross-fetch');
const UserAgent = require('user-agents');
const moment = require('moment');


const wait = (ms) => {
  return new Promise(resolve => setTimeout(() => resolve(), ms));
};

const initBrowser = async (disableBlocker = false) => {
  puppeteer.use(StealthPlugin());

  const browser = await puppeteer.launch({
    headless: true,
    ignoreHTTPSErrors: true,
    args: ['--no-sandbox', '--headless', '--disable-gpu', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  page.on('request', request => Promise.resolve().then(() => request.continue()).catch(e => {}));
  await page.setViewport({
    width: 1920,
    height: 1080
  });

  const userAgent = new UserAgent({ deviceCategory: 'desktop', platform: 'MacIntel' }).random().toString();
  console.log(userAgent);
  await page.setUserAgent(userAgent);

  if (!disableBlocker) {
    const blocker = await PuppeteerBlocker.fromPrebuiltAdsAndTracking(fetch);
    await blocker.enableBlockingInPage(page);
  }

  return {browser, page};
};

const scrollPageToBottom = async (page, stepHeight) => {
  const viewportHeight = page.viewport().height;
  let viewportIncr = 0;
  while (viewportIncr + viewportHeight < stepHeight) {
    await page.evaluate(_viewportHeight => {
      window.scrollBy(0, _viewportHeight);
    }, viewportHeight);
    await page.waitForTimeout(200);
    viewportIncr = viewportIncr + viewportHeight;
  }
};

const generateTelegramMessageText = (product) => {
  let discountEmoji = '🔵';
  if (product.discount > 30) discountEmoji = '🟢';
  if (product.discount >= 50) discountEmoji = '🤡';

  return `<s>${product.oldPrice}</s> - <b>💸 ${product.newPrice}</b>\n`
    + `Скидка - <b>${discountEmoji} ${product.discount}%</b>\n`
    + `<b>${product.name}</b>\n`
    + `<a href="${product.url}">Ссылка на товар</a>\n`
    + `Магазин - ${product.shop.toUpperCase()}\n`
};

const getTime = () => {
  return moment().format('HH:mm:ss');
};

module.exports = {
  wait,
  initBrowser,
  scrollPageToBottom,
  generateTelegramMessageText,
  getTime
};
