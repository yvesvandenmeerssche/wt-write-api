const WTLibs = require('@windingtree/wt-js-libs');
const SwarmAdapter = require('@windingtree/off-chain-adapter-swarm');
const HttpAdapter = require('@windingtree/off-chain-adapter-http');
const knex = require('knex');

module.exports = {
  wtIndexAddress: '0x933198455e38925bccb4bfe9fb59bac31d00b4d3',
  port: 8000,
  wtLibs: WTLibs.createInstance({
    dataModelOptions: {
      provider: 'https://ropsten.infura.io/WKNyJ0kClh8Ao5LdmO7z',
    },
    offChainDataOptions: {
      adapters: {
        'bzz-raw': {
          options: {
            swarmProviderUrl: 'https://swarm-gateways.net/',
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
  db: knex({
    client: 'sqlite3',
    connection: {
      filename: './.dev.sqlite',
    },
    useNullAsDefault: true,
  }),
};
