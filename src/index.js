const { app } = require('./app');
const config = require('./config');
const WT = require('./services/wt');

const wt = new WT.WT(config.wtLibs, config.wtIndexAddress);
WT.set(wt);

const server = app.listen(config.port, () => {
  config.logger.info(`WT Write API at ${config.port}...`);
  if (config.networkSetup) {
    config.networkSetup(config);
  }
});

module.exports = server;
