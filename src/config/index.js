const winston = require('winston');

const env = process.env.WT_CONFIG || 'dev';

module.exports = Object.assign({
  logHttpTraffic: true,
  logger: winston.createLogger({
    level: 'warn',
    transports: [
      new winston.transports.Console({
        format: winston.format.simple(),
      }),
    ],
  }),
}, require(`./${env}`));
