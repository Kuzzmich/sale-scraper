const config = require('config');
const Queue = require('bull');
const Sentry = require("@sentry/node");
Sentry.init({ dsn: config.sentryDsn });
const { getTime } = require('../helpers');
const scrapers = require('../scrapers');
const scrapersList = Object.keys(scrapers);


const scrapingQueue = new Queue(
  'scrapers',
  config.redisUrl,
  {
    guardInterval: 30000,
    limiter: {
      max: 1,
      duration: 180000,
    }
  }
);

scrapingQueue.process(async (job, done) => {
  try {
    const scraperName = job.data.scraperName;
    await scrapers[scraperName](true);

    const currentScraperIndex = scrapersList.findIndex(s => s === scraperName);
    const nextScraper = scrapersList[currentScraperIndex + 1] || scrapersList[0];

    console.log(`${getTime()} - Posting new ${nextScraper.toUpperCase()} parsing job to queue`);
    scrapingQueue.add(
      {scraperName: nextScraper},
      {delay: 180000, attemps: 1, removeOnComplete: true, removeOnFail: true}
    );

    done();
  } catch (e) {
    Sentry.captureException(e);
    console.error(e);
    done(e)
  }
});

const startScraping = () => {
  const scraperName = scrapersList[0];
  scrapingQueue.add(
      {scraperName: scraperName},
      {delay: 3000, attemps: 1, removeOnComplete: true, removeOnFail: true}
    );
};

module.exports = {
  startScraping,
  queue: scrapingQueue,
};
