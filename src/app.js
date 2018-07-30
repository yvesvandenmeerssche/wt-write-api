const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const config = require('./config');
const { version } = require('../package.json');
const { HttpError, HttpInternalError, Http404Error } = require('./errors');
const { attachAccount, handleOnChainErrors } = require('./middleware');
const { createHotel, updateHotel, deleteHotel, getHotel } = require('./controllers/hotels');
const { createAccount, updateAccount, deleteAccount } = require('./controllers/accounts');

const app = express();

app.use(bodyParser.json());

// Logg HTTP requests.
app.use(morgan(':remote-addr :remote-user [:date[clf]] :method :url HTTP/:http-version :status :res[content-length] - :response-time ms', {
  stream: {
    write: (msg) => config.logger.info(msg),
  },
}));

// Root handler
app.get('/', (req, res) => {
  res.status(200).json({
    docs: 'https://github.com/windingtree/wt-write-api/blob/master/README.md',
    info: 'https://github.com/windingtree/wt-write-api',
    version,
    config: process.env.WT_CONFIG,
    wtIndexAddress: config.wtIndexAddress,
  });
});

// Accounts
// NOTE: For security reasons, accounts are write only.
app.post('/account', createAccount);
app.put('/account/:id', attachAccount, updateAccount);
app.delete('/account/:id', attachAccount, deleteAccount);

// Hotels
app.post('/hotels', attachAccount, createHotel, handleOnChainErrors);
app.get('/hotels/:address', getHotel);
app.delete('/hotels/:address', attachAccount, deleteHotel, handleOnChainErrors);
app.patch('/hotels/:address', attachAccount, updateHotel, handleOnChainErrors);

// 404 handler
app.use('*', (req, res, next) => {
  next(new Http404Error());
});

// Error handler
app.use((err, req, res, next) => {
  if (!(err instanceof HttpError)) {
    config.logger.error(err.stack);
    err = new HttpInternalError();
  }

  res.status(err.status).json(err.toPlainObject());
});

module.exports = {
  app,
};
