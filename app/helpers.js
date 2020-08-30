const puppeteer = require('puppeteer');
const userAgent = require('user-agents');


const wait = (ms) => {
  return new Promise(resolve => setTimeout(() => resolve(), ms));
};

const initBrowser = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.CHROME_BIN || null,
    args: ['--no-sandbox', '--headless', '--disable-gpu', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  await page.setUserAgent(userAgent.toString());

  return {browser, page};
};

const scrollPageToBottom = async (page, stepHeight) => {
  const viewportHeight = page.viewport().height;
  let viewportIncr = 0;
  while (viewportIncr + viewportHeight < stepHeight) {
    await page.evaluate(_viewportHeight => {
      window.scrollBy(0, _viewportHeight);
    }, viewportHeight);
    await page.waitFor(200);
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

module.exports = {
  wait,
  initBrowser,
  scrollPageToBottom,
  generateTelegramMessageText
};
