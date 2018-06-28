const express = require('express');
const bodyParser = require('body-parser');
const { logger } = require('./config');
const { version } = require('../package.json');
const { HttpError, HttpInternalError, Http404Error } = require('./errors');

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
