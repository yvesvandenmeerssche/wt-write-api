const { uploaders, walletPassword } = require('./config');

module.exports.attachProfile = (req, res, next) => {
  // NOTE: We assume this will be dynamically assembled based on
  // users authentication info in the future.
  req.profile = {
    uploaders,
    walletPassword,
  };
  next();
};
