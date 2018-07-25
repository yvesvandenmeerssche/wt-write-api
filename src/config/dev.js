const winston = require('winston');
const WTLibs = require('@windingtree/wt-js-libs');
const InMemoryAdapter = require('@windingtree/off-chain-adapter-in-memory');
const SwarmAdapter = require('@windingtree/off-chain-adapter-swarm');
const HttpAdapter = require('@windingtree/off-chain-adapter-http');
const knex = require('knex');
const { deployIndex } = require('../../management/local-network');
const WT = require('../services/wt');

const logger = winston.createLogger({
  level: 'debug',
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

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
        json: {
          create: (options) => {
            return new InMemoryAdapter(options);
          },
        },
        'bzz-raw': {
          options: {
            swarmProviderUrl: 'http://localhost:8500',
          },
          create: (options) => {
            return new SwarmAdapter(options);
          },
        },
        https: {
          create: () => {
            return new HttpAdapter();
          },
        },
      },
    },
  }),
  wtIndexAddress: '0xdummy',
  db: knex({
    client: 'sqlite3',
    connection: {
      filename: './.dev.sqlite',
    },
    useNullAsDefault: true,
  }),
  networkSetup: async (currentConfig) => {
    currentConfig.wtIndexAddress = (await deployIndex()).address;
    const wt = WT.get();
    wt.wtIndexAddress = currentConfig.wtIndexAddress;
    logger.info(`Winding Tree index deployed to ${currentConfig.wtIndexAddress}`);
  },
  logHttpTraffic: true,
  logger: logger,
};
