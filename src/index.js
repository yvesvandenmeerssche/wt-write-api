const { app } = require('./app');
const { logger, port } = require('./config');

const server = app.listen(port, () => {
  logger.info(`WT Write API at ${port}...`);
});

module.exports = server;
