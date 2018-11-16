const knex = require('knex');

module.exports = {
  port: 8000,
  wtIndexAddress: '0x082fa119ffc7427652741456669ce1b306d207e3',
  ethNetwork: 'ropsten',
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
