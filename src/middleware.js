const WTLibs = require('@windingtree/wt-js-libs');

const WT = require('./services/wt');
const Account = require('./models/account');
const { UploaderConfig } = require('./services/uploaders');
const { HttpBadGatewayError, HttpPaymentRequiredError,
  HttpForbiddenError, HttpUnauthorizedError } = require('./errors');
const { ACCESS_KEY_HEADER, WALLET_PASSWORD_HEADER } = require('./constants');

/**
 * Attach account to req based on the provided access key.
 */
module.exports.attachAccount = async (req, res, next) => {
  try {
    const wt = WT.get(),
      accessKey = req.header(ACCESS_KEY_HEADER),
      walletPassword = req.header(WALLET_PASSWORD_HEADER);
    if (!accessKey || !walletPassword) {
      throw new HttpUnauthorizedError();
    }
    const account = await Account.getByKey(accessKey);
    if (!account) {
      throw new HttpUnauthorizedError('unauthorized', 'Invalid access key.');
    }
    req.account = Object.assign({}, account, {
      uploaders: UploaderConfig.fromAccount(account),
      withWallet: async (fn) => {
        const wallet = wt.createWallet(account.wallet);
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
    });
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
