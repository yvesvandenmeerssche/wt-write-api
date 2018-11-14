const knex = require('knex');

module.exports = {
  port: 8000,
  wtIndexAddress: '0x2964288481089b2abe91e727b2829babb01f5fa2',
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
      filename: './.demo.sqlite',
    },
    useNullAsDefault: true,
  }),
};
