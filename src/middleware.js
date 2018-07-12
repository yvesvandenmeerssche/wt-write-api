const { uploaders, walletPassword } = require('./config');

module.exports.attachUploaderConfig = (req, res, next) => {
  // NOTE: We assume this will be dynamically assembled based on
  // users authentication info in the future.
  req.uploaders = uploaders;
  req.walletPassword = walletPassword;
  next();
};
