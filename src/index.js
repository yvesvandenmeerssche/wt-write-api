const { app } = require('./app');
const { logger, port, wtLibs, wtIndexAddress } = require('./config');
const downloaders = require('./services/downloaders');

const downloader = new downloaders.WTDownloader(wtLibs, wtIndexAddress);
downloaders.set(downloader);

const server = app.listen(port, () => {
  logger.info(`WT Write API at ${port}...`);
});

module.exports = server;
