const config = require('config');
const Queue = require('bull');
const Sentry = require("@sentry/node");
Sentry.init({ dsn: config.sentryDsn });
const { getTime } = require('../helpers');
const services = require('../services');


const telegramMessageQueue = new Queue(
  'telegram-messages',
  config.redisUrl,
  {
    guardInterval: 61000,
    limiter: {
      max: 1,
      duration: 61000
    }
  }
);

telegramMessageQueue.process(async (job, done) => {
  try {
    console.log(`${getTime()} - sending message`);
    const message = job.data;
    await services.sendTelegramMediaGroup(message.products);
    console.log(`${getTime()} - message is sent`);
    done();
  } catch (e) {
    Sentry.captureException(e);
    console.log(`${getTime()} - message sending error`);
    console.error(e);
    done(e)
  }
});

module.exports = telegramMessageQueue;
