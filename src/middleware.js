const WTLibs = require('@windingtree/wt-js-libs');

const WT = require('./services/wt');
const Profile = require('./models/profile');
const { UploaderConfig } = require('./services/uploaders');
const { HttpUnauthorizedError } = require('./errors');

module.exports.attachProfile = async (req, res, next) => {
  try {
    const wt = WT.get(),
      accessKey = req.header('X-Access-Key'),
      walletPassword = req.header('X-Wallet-Password');
    if (!accessKey || !walletPassword) {
      throw new HttpUnauthorizedError();
    }
    const profile = await Profile.get(accessKey);
    if (!profile) {
      throw new HttpUnauthorizedError('unauthorized', 'Invalid access key.');
    }
    req.profile = {
      uploaders: UploaderConfig.fromProfile(profile),
      withWallet: async (fn) => {
        const wallet = wt.createWallet(profile.wallet);
        try {
          wallet.unlock(walletPassword);
        } catch (err) {
          if (err instanceof WTLibs.errors.WalletPasswordError) {
            throw new HttpUnauthorizedError('unauthorized', 'Invalid password.');
          }
          throw err;
        }
        try {
          return (await fn(wallet));
        } finally {
          wallet.lock();
        }
      },
    };
    next();
  } catch (err) {
    next(err);
  }
};
