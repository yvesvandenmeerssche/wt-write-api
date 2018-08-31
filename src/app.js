const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const YAML = require('yamljs');

const config = require('./config');
const { version } = require('../package.json');
const { HttpError, HttpInternalError, Http404Error, HttpBadRequestError } = require('./errors');
const { attachAccount, handleOnChainErrors } = require('./middleware');
const { createHotel, updateHotel, deleteHotel, getHotel,
  transferHotel } = require('./controllers/hotels');
const { createAccount, updateAccount, deleteAccount } = require('./controllers/accounts');

const app = express();

// Swagger docs.
const swaggerDocument = YAML.load(path.resolve('./docs/swagger.yaml'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(cors());

app.use(bodyParser.json());
app.use((err, req, res, next) => {
  // Catch and handle bodyParser errors.
  if (err.statusCode === 400 && err.type === 'entity.parse.failed') {
    return next(new HttpBadRequestError('badRequest', 'Invalid JSON.'));
  }
  next(err);
});

// Logg HTTP requests.
app.use(morgan(':remote-addr :remote-user [:date[clf]] :method :url HTTP/:http-version :status :res[content-length] - :response-time ms', {
  stream: {
    write: (msg) => config.logger.info(msg),
  },
}));

// Root handler
app.get('/', (req, res) => {
  res.status(200).json({
    docs: `${config.baseUrl}/docs`,
    info: 'https://github.com/windingtree/wt-write-api/blob/master/README.md',
    version,
    config: process.env.WT_CONFIG,
    wtIndexAddress: config.wtIndexAddress,
  });
});

// Accounts
// NOTE: For security reasons, accounts are write only.
app.post('/accounts', createAccount);
app.put('/accounts/:id', attachAccount, updateAccount);
app.delete('/accounts/:id', attachAccount, deleteAccount);

// Hotels
app.post('/hotels', attachAccount, createHotel, handleOnChainErrors);
app.get('/hotels/:address', getHotel, handleOnChainErrors);
app.delete('/hotels/:address', attachAccount, deleteHotel, handleOnChainErrors);
app.patch('/hotels/:address', attachAccount, updateHotel, handleOnChainErrors);
app.post('/hotels/:address/transfer', attachAccount, transferHotel, handleOnChainErrors);

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
