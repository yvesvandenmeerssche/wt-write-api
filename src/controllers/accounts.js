const { HttpForbiddenError, HttpValidationError } = require('../errors');
const { ValidationError } = require('../services/validators');
const Account = require('../models/account');

const ACCOUNT_FIELDS = ['wallet', 'uploaders'];

function _validateRequest (body) {
  for (let field of ACCOUNT_FIELDS) {
    if (!body[field]) {
      throw new HttpValidationError('validationFailed', `Missing required property: ${field}`);
    }
  }
  for (let field in body) {
    if (ACCOUNT_FIELDS.indexOf(field) === -1) {
      throw new HttpValidationError('validationFailed', `Unknown property: ${field}`);
    }
  }
}

/**
 * Create a new account.
 */
module.exports.createAccount = async (req, res, next) => {
  try {
    // 1. Validate request payload.
    _validateRequest(req.body);
    // 2. Save the new account.
    // (Note: validation of wallet and uploader contents is done
    // here as well.)
    let { id: accountId, accessKey } = await Account.create({
      wallet: req.body.wallet,
      uploaders: req.body.uploaders,
    });
    // 3. Return the account id and access key.
    res.status(201).json({ accountId, accessKey });
  } catch (err) {
    if (err instanceof ValidationError) {
      return next(new HttpValidationError('validationFailed', err.message));
    }
    next(err);
  }
};

/**
 * Update an existing account.
 */
module.exports.updateAccount = async (req, res, next) => {
  try {
    // 1. Validate request payload.
    _validateRequest(req.body);
    if (req.params.id !== req.account.id) {
      let msg = 'You do not have the right to update this account.';
      throw new HttpForbiddenError('forbidden', msg);
    }
    // 2. Update the account.
    // (Note: validation of wallet and uploader contents is done
    // here as well.)
    await Account.update(req.account.id, {
      wallet: req.body.wallet,
      uploaders: req.body.uploaders,
    });
    // 3. Return the access key.
    res.sendStatus(204);
  } catch (err) {
    if (err instanceof ValidationError) {
      return next(new HttpValidationError('validationFailed', err.message));
    }
    next(err);
  }
};

/**
 * Delete an existing account.
 */
module.exports.deleteAccount = async (req, res, next) => {
  try {
    if (req.params.id !== req.account.id) {
      let msg = 'You do not have the right to delete this account.';
      throw new HttpForbiddenError('forbidden', msg);
    }
    await Account.delete(req.account.id);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};
