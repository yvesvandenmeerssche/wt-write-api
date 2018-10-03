const winston = require('winston');
const knex = require('knex');

module.exports = {
  port: 8100,
  wtIndexAddress: '0xdummy',
  swarm: {
    provider: 'http://localhost:8500',
  },
  ethereumProvider: 'http://localhost:8645',
  db: knex({
    client: 'sqlite3',
    connection: {
      filename: './.test.sqlite',
    },
    useNullAsDefault: true,
  }),
  allowedUploaders: ['s3', 'swarm', 'inMemory'],
  logger: winston.createLogger({
    level: 'warn',
    transports: [
      new winston.transports.Console({
        format: winston.format.simple(),
        stderrLevels: ['error'],
      }),
    ],
  }),
};
