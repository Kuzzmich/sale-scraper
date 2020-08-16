const path = require('path');


module.exports = (app) => {
  app.get('/view-page', (req, res, next) => {
    res.sendFile(path.join(__dirname + '/../index.html'));
  });
};
