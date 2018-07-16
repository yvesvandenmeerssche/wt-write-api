const winston = require('winston');

const env = process.env.NODE_ENV || 'dev';

module.exports = Object.assign({
  logger: winston.createLogger({
    level: 'warn',
    transports: [
      new winston.transports.Console({
        format: winston.format.simple(),
      }),
    ],
  }),
}, require(`./${env}`));
