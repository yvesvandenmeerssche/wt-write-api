const crypto = require('crypto');

const { db } = require('../config');

const TABLE = 'profiles';

module.exports.createTable = async function () {
  await db.schema.createTable(TABLE, (table) => {
    table.string('secret_key').primary();
    table.string('wallet', 1023);
    table.string('uploader_config', 1023);
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

/**
 * Create a new profile and return its secret key.
 *
 * @param {Object} profileData
 * @return {Object}
 */
module.exports.create = async function (profileData) {
  const secretKey = profileData.secretKey || (await _generateKey());
  const profile = await db(TABLE).insert({
    wallet: JSON.stringify(profileData.wallet),
    uploader_config: JSON.stringify(profileData.uploaderConfig),
    secret_key: secretKey,
  });
  return secretKey;
};

/**
 * Get a profile.
 *
 * @param {Object} profileData
 * @return {Object}
 */
module.exports.get = async function (secretKey) {
  const profile = (await db(TABLE).select('secret_key', 'uploader_config', 'wallet').where({
    secret_key: secretKey,
  }))[0];
  return profile && {
    wallet: JSON.parse(profile.wallet),
    uploaderConfig: JSON.parse(profile.uploader_config),
    secretKey: secretKey,
  };
};
