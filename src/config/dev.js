const WTLibs = require('@windingtree/wt-js-libs');

const winston = require('winston');

module.exports = {
  port: 8000,
  wtLibs: WTLibs.createInstance({
    dataModelOptions: {
      provider: 'http://localhost:8545',
    },
    offChainDataOptions: {
      adapters: {
        dummy: {
          options: {},
          create: () => {
            return {
              download: () => { return { dummy: 'content' }; },
            };
          },
        },
      },
    },
  }),
  wtIndexAddress: '0xdummy',
  logger: winston.createLogger({
    level: 'debug',
    transports: [
      new winston.transports.Console({
        format: winston.format.simple(),
      }),
    ],
  }),
};
