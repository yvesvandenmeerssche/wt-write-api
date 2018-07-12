const { uploaders, walletPassword } = require('./config');
const WT = require('./services/wt');

module.exports.attachProfile = (req, res, next) => {
  // NOTE: We assume this will be dynamically assembled based on
  // users authentication info in the future.
  const wt = WT.get();
  const walletData = { dummy: 'dummy' }; // TODO
  req.profile = {
    uploaders: uploaders,
    withWallet: async (fn) => {
      let wallet = await wt.createWallet(walletData);
      wallet.unlock(walletPassword);
      try {
        return (await fn(wallet));
      } finally {
        wallet.lock();
      }
    },
  };
  next();
};
