const winston = require('winston');
const knex = require('knex');

module.exports = {
  port: 8000,
  ethereumProvider: 'http://localhost:8545',
  wtIndexAddress: '0xdummy',
  swarm: {
    provider: 'http://localhost:8500',
    timeoutRead: 500,
    timeoutWrite: 1000,
  },
  baseUrl: 'http://localhost:8000',
  db: knex({
    client: 'sqlite3',
    connection: {
      filename: './.dev.sqlite',
    },
    useNullAsDefault: true,
  }),
  allowedUploaders: ['s3', 'swarm', 'inMemory'],
  networkSetup: async (currentConfig) => {
    const { deployIndex } = require('../utils/local-network');
    currentConfig.wtIndexAddress = (await deployIndex()).address;
    const wt = require('../services/wt').get();
    wt.wtIndexAddress = currentConfig.wtIndexAddress;
    currentConfig.logger.info(`Winding Tree index deployed to ${currentConfig.wtIndexAddress}`);
  },
  logger: winston.createLogger({
    level: 'debug',
    transports: [
      new winston.transports.Console({
        format: winston.format.simple(),
        stderrLevels: ['error'],
      }),
    ],
  }),
};
