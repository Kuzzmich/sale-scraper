var port = process.env.port || 8008;

var express = require('express')
    , http = require('http')
    , app = express()
;

app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

require('./app/routes.js')(app);

app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke! Please refresh the page...');
});


var httpServer = http.createServer(app);
httpServer.listen(port, function () {
    console.log('Listening on port %d', httpServer.address().port);
});

module.exports = app;
