const knex = require('knex');

module.exports = {
  port: 8000,
  wtIndexAddress: '0x3b476ac17ffea8dcf2dbd5ef787a5baeeebe9984',
  ethereumProvider: 'https://ropsten.infura.io/WKNyJ0kClh8Ao5LdmO7z',
  swarmProvider: 'https://swarm.windingtree.com',
  db: knex({
    client: 'sqlite3',
    connection: {
      filename: './.playground.sqlite',
    },
    useNullAsDefault: true,
  }),
};
