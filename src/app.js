const express = require('express');
const bodyParser = require('body-parser');
const { logger } = require('./config');
const { version } = require('../package.json');
const { HttpError, HttpInternalError, Http404Error } = require('./errors');
const { attachUploaderConfig } = require('./middleware');
const { createHotel, updateHotel, deleteHotel, getHotel } = require('./controllers');

const app = express();

app.use(bodyParser.json());

// Root handler
app.get('/', (req, res) => {
  res.status(200).json({
    docs: 'https://github.com/windingtree/wt-write-api/blob/master/README.md',
    info: 'https://github.com/windingtree/wt-write-api',
    version,
  });
});

// Hotels
app.post('/hotel', attachUploaderConfig, createHotel);
app.get('/hotel/:address', attachUploaderConfig, getHotel);
app.delete('/hotel/:address', attachUploaderConfig, deleteHotel);
app.patch('/hotel/:address', attachUploaderConfig, updateHotel);

// 404 handler
app.use('*', (req, res, next) => {
  next(new Http404Error());
});

// Error handler
app.use((err, req, res, next) => {
  if (!(err instanceof HttpError)) {
    logger.error(err.stack);
    err = new HttpInternalError();
  }

  res.status(err.status).json(err.toPlainObject());
});

module.exports = {
  app,
};
