const knex = require('knex');

module.exports = {
  port: 8000,
  wtIndexAddress: '0x933198455e38925bccb4bfe9fb59bac31d00b4d3',
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
