const crypto = require('crypto');

const { db } = require('../config');

const TABLE = 'profiles';

module.exports.createTable = async function () {
  await db.schema.createTable(TABLE, (table) => {
    table.string('access_key').primary();
    table.string('wallet', 1023);
    table.string('uploaders', 1023);
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
  const accessKey = profileData.accessKey || (await _generateKey());
  const profile = await db(TABLE).insert({
    wallet: JSON.stringify(profileData.wallet),
    uploaders: JSON.stringify(profileData.uploaders),
    access_key: accessKey,
  });
  return accessKey;
};

/**
 * Get a profile.
 *
 * @param {Object} profileData
 * @return {Object}
 */
module.exports.get = async function (accessKey) {
  const profile = (await db(TABLE).select('access_key', 'uploaders', 'wallet').where({
    access_key: accessKey,
  }))[0];
  return profile && {
    wallet: JSON.parse(profile.wallet),
    uploaders: JSON.parse(profile.uploaders),
    accessKey: accessKey,
  };
};
