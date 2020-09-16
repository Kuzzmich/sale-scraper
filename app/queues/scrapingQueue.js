const config = require('config');
const Queue = require('bull');
const Sentry = require("@sentry/node");
Sentry.init({ dsn: config.sentryDsn });
const { getTime } = require('../helpers');
const scraper = require('../scraper');
const parsersList = scraper.parsersList;


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
    const parserName = job.data.parserName;
    await scraper.scrapeData(parserName,true);

    const currentParserIndex = parsersList.findIndex(s => s === parserName);
    const nextParser = parsersList[currentParserIndex + 1] || parsersList[0];

    console.log(`${getTime()} - Posting new ${nextParser.toUpperCase()} parsing job to queue`);
    scrapingQueue.add(
      {parserName: nextParser},
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
  const parserName = parsersList[0];
  scrapingQueue.add(
      {parserName: parserName},
      {delay: 3000, attemps: 1, removeOnComplete: true, removeOnFail: true}
    );
};

module.exports = {
  startScraping,
  queue: scrapingQueue,
};
