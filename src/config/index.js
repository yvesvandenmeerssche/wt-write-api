const winston = require('winston');
const WTLibs = require('@windingtree/wt-js-libs');
const SwarmAdapter = require('@windingtree/off-chain-adapter-swarm');
const HttpAdapter = require('@windingtree/off-chain-adapter-http');
const InMemoryAdapter = require('@windingtree/off-chain-adapter-in-memory');

const env = process.env.WT_CONFIG || 'dev';

const config = Object.assign({
  logger: winston.createLogger({
    level: 'info',
    transports: [
      new winston.transports.Console({
        format: winston.format.simple(),
        stderrLevels: ['error'],
      }),
    ],
  }),
  // Limit allowed uploaders to prevent dummy uploaders
  // from being used in production.
  allowedUploaders: ['s3', 'swarm'],
  baseUrl: process.env.BASE_URL || 'https://playground-write-api.windingtree.com',
}, require(`./${env}`));

config.wtLibs = WTLibs.createInstance({
  dataModelOptions: {
    provider: config.ethereumProvider,
  },
  offChainDataOptions: {
    adapters: {
      'in-memory': {
        create: (options) => {
          return new InMemoryAdapter(options);
        },
      },
      'bzz-raw': {
        options: {
          swarmProviderUrl: config.swarm.provider,
          timeout: config.swarm.timeout,
          timeoutRead: config.swarm.timeoutRead,
          timeoutWrite: config.swarm.timeoutWrite,
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
});

module.exports = config;
