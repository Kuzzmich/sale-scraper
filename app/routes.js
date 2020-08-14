const axios = require('axios');
const puppeteer = require('puppeteer');
const scrollPageToBottom = require('puppeteer-autoscroll-down');
const userAgent = require('user-agents');
const $ = require('cheerio');
const fs = require("fs");
const path = require('path');
const helpers = require('./helpers');
const url = 'https://www.asos.com/ru/men/rasprodazha/tufli-i-sportivnaya-obuv/cat/?cid=1935&currentpricerange=490-17990&nlid=mw|%D1%80%D0%B0%D1%81%D0%BF%D1%80%D0%BE%D0%B4%D0%B0%D0%B6%D0%B0|%D1%81%D0%BE%D1%80%D1%82%D0%B8%D1%80%D0%BE%D0%B2%D0%B0%D1%82%D1%8C%20%D0%BF%D0%BE%20%D1%82%D0%B8%D0%BF%D1%83%20%D0%BF%D1%80%D0%BE%D0%B4%D1%83%D0%BA%D1%82%D0%B0&refine=attribute_1047:8606';

module.exports = (app) => {
  app.get('/view-page', (req, res, next) => {
    res.sendFile(path.join(__dirname + '/../index.html'));
  });
};
