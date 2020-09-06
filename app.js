const port = process.env.port || 8008;
const express = require('express');
const http = require('http');
const scrapingQueue = require('./app/queues/scrapingQueue');
const app = express();

const cors = require('cors');

app.use(cors());

require('./app/api.js')(app);
require('./app/routes.js')(app);

app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke! Please refresh the page...');
});


const httpServer = http.createServer(app);
httpServer.listen(port, function () {
    console.log('Listening on port %d', httpServer.address().port);
});

if (process.env.NODE_ENV) {
  scrapingQueue.startScraping();
}

module.exports = app;
