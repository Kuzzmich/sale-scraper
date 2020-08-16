const config = require('config');
const TelegramBot = require('node-telegram-bot-api');


const token = config.telegramBotToken;
const bot = new TelegramBot(token, {polling: true});

module.exports = bot;

