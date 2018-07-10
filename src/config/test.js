const WTLibs = require('@windingtree/wt-js-libs');

const winston = require('winston');

module.exports = {
  port: 8100,
  wtLibs: WTLibs.createInstance({
    dataModelOptions: {
      provider: 'http://localhost:8645',
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
    level: 'warn',
    transports: [
      new winston.transports.Console({
        format: winston.format.simple(),
      }),
    ],
  }),
};
