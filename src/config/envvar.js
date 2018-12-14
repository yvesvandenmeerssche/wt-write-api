const knex = require('knex');

module.exports = {
  port: process.env.PORT || 8000,
  wtIndexAddress: process.env.WT_INDEX_ADDRESS,
  ethNetwork: process.env.ETH_NETWORK_NAME,
  ethereumProvider: process.env.ETH_NETWORK_PROVIDER,
  baseUrl: process.env.BASE_URL,
  swarm: {
    provider: process.env.ADAPTER_SWARM_GATEWAY,
    timeoutRead: process.env.ADAPTER_SWARM_READ_TIMEOUT || 1000,
    timeoutWrite: process.env.ADAPTER_SWARM_WRITE_TIMEOUT || 2500,
  },
  db: knex({
    client: process.env.DB_CLIENT,
    connection: JSON.parse(process.env.DB_CLIENT_OPTIONS),
    useNullAsDefault: true,
  }),
};
