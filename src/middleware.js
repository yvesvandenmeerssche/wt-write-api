const WTLibs = require('@windingtree/wt-js-libs');

const WT = require('./services/wt');
const Profile = require('./models/profile');
const { UploaderConfig } = require('./services/uploaders');
const { HttpBadGatewayError, HttpPaymentRequiredError,
  HttpForbiddenError, HttpUnauthorizedError } = require('./errors');

/**
 * Attach profile to req based on the provided access key.
 */
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

/**
 * Replace well-defined on-chain errors with the corresponding
 * HTTP errors.
 */
module.exports.handleOnChainErrors = (err, req, res, next) => {
  if (!err) {
    return next();
  }
  if (err instanceof WTLibs.errors.WalletSigningError) {
    return next(new HttpForbiddenError());
  }
  if (err instanceof WTLibs.errors.InsufficientFundsError) {
    return next(new HttpPaymentRequiredError());
  }
  if (err instanceof WTLibs.errors.InaccessibleEthereumNodeError) {
    let msg = 'Ethereum node not reachable. Please try again later.';
    return next(new HttpBadGatewayError(msg));
  }
  next(err);
};
