const knex = require('knex');

module.exports = {
  port: 8000,
  wtIndexAddress: '0x3b476ac17ffea8dcf2dbd5ef787a5baeeebe9984',
  ethereumProvider: 'https://ropsten.infura.io/' + process.env.INFURA_API_KEY,
  swarm: {
    provider: 'https://swarm.windingtree.com',
    timeoutRead: 1000,
    timeoutWrite: 2500,
  },
  db: knex({
    client: 'sqlite3',
    connection: {
      filename: './.playground.sqlite',
    },
    useNullAsDefault: true,
  }),
};
