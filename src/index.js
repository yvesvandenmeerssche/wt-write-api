const { app } = require('./app');
const { logger, port, wtLibs, wtIndexAddress } = require('./config');
const WT = require('./services/wt');

const wt = new WT.WT(wtLibs, wtIndexAddress);
WT.set(wt);

const server = app.listen(port, () => {
  logger.info(`WT Write API at ${port}...`);
});

module.exports = server;
