const crypto = require('crypto');

const { db } = require('../config');
const { validateWallet, validateUploaders } = require('../services/validators');

const TABLE = 'accounts';

module.exports.createTable = async function () {
  await db.schema.createTable(TABLE, (table) => {
    table.string('access_key').primary();
    table.string('wallet', 1023);
    table.string('uploaders', 1023);
    // The timestamp is not exposed outside of the DB - we
    // have added it as a precautionary measure to help in
    // case of possible future problem investigations.
    table.timestamp('updated_at').defaultTo(db.fn.now());
  });
};

module.exports.dropTable = async function () {
  await db.schema.dropTableIfExists(TABLE);
};

/**
 * Generate a new secret key.
 */
async function _generateKey () {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(48, (err, buffer) => {
      if (err) {
        return reject(err);
      }
      resolve(buffer.toString('base64'));
    });
  });
}

const VALIDATED_FIELDS = [
  { name: 'wallet', validator: validateWallet },
  { name: 'uploaders', validator: validateUploaders },
];

/**
 * Validate the given account data.
 */
function _validate (accountData) {
  for (let field of VALIDATED_FIELDS) {
    field.validator(accountData[field.name]);
  }
}

/**
 * Create a new account and return its secret key.
 *
 * @param {Object} accountData
 * @return {Promise<String>}
 */
module.exports.create = async function (accountData) {
  _validate(accountData);
  const accessKey = await _generateKey();
  await db(TABLE).insert({
    'wallet': JSON.stringify(accountData.wallet),
    'uploaders': JSON.stringify(accountData.uploaders),
    'access_key': accessKey,
  });
  return accessKey;
};

/**
 * Overwrite an existing account with new data.
 *
 * @param {Object} accountData
 * @return {Promise<void>}
 */
module.exports.update = async function (accessKey, accountData) {
  _validate(accountData);
  await db(TABLE).where('access_key', accessKey).update({
    'wallet': JSON.stringify(accountData.wallet),
    'uploaders': JSON.stringify(accountData.uploaders),
    'updated_at': db.fn.now(),
  });
};

/**
 * Get an account.
 *
 * @param {String} accessKey
 * @return {Promise<Object>}
 */
module.exports.get = async function (accessKey) {
  const account = (await db(TABLE).select('access_key', 'uploaders', 'wallet').where({
    'access_key': accessKey,
  }))[0];
  return account && {
    wallet: JSON.parse(account.wallet),
    uploaders: JSON.parse(account.uploaders),
    accessKey: accessKey,
  };
};
/**
 * Delete an account.
 *
 * @param {String} accessKey
 * @return {Promise<void>}
 */
module.exports.delete = async function (accessKey) {
  await db(TABLE).where('access_key', accessKey).delete();
};
