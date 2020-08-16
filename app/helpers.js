const puppeteer = require('puppeteer');
const userAgent = require('user-agents');


const wait = (ms) => {
  return new Promise(resolve => setTimeout(() => resolve(), ms));
};

const initBrowser = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setUserAgent(userAgent.toString());

  return { browser, page };
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

module.exports = {
  wait,
  initBrowser,
  scrollPageToBottom,
};
