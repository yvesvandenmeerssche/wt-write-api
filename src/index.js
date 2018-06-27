const { app } = require('./app');
const config = require('./config');

const server = app.listen(config.port, () => {
  console.log(`WT Write API at ${config.port}...`);
});

module.exports = server;
