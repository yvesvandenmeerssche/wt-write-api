const _ = require('lodash');
const tv4 = require('tv4');
const tv4Formats = require('tv4-formats');
const countryCodes = require('iso-3166-1-alpha-2');
const currencyCodes = require('currency-codes');
const timezones = require('timezones.json');
const WTLibs = require('@windingtree/wt-js-libs');

const descriptionSchema = require('./description-schema.json');
const ratePlansSchema = require('./rateplans-schema.json');
const availabilitySchema = require('./availability-schema.json');
const uploadersSchema = require('./uploaders-schema.json');
const { wtLibs } = require('../../config');

class ValidationError extends Error {};

const TIMEZONES = new Set(_(timezones).map('utc').flatten().value());

tv4.addFormat(tv4Formats); // We use the "date-time" and "uri" formats from this module.
tv4.addFormat('country-code', (data) => {
  if (countryCodes.getCountry(data)) {
    return null;
  }
  return 'Not a valid ISO 3166-1 alpha-2 country code.';
});
tv4.addFormat('timezone', (data) => {
  if (TIMEZONES.has(data)) {
    return null;
  }
  return 'Not a valid timezone.';
});
tv4.addFormat('currency-code', (data) => {
  if (currencyCodes.code(data)) {
    return null;
  }
  return 'Not a valid ISO 4217 currency code.';
});

/* Note: the json schemas were generated from the swagger
 * definition at
 *
 * https://github.com/windingtree/wiki/blob/master/hotel-data-swagger.yaml
 *
 * (version 0.0.4) using the "openapi2schema" CLI tool.
 */

function _validate (data, schema) {
  if (!tv4.validate(data, schema, false, true)) {
    var msg = tv4.error.message + ': ' + tv4.error.dataPath;
    throw new ValidationError(msg);
  }
}

/**
 * Validate data against description json schema definition.
 *
 * @param {Object} data
 * @return {undefined}
 * @throws {ValidationError} When data validation fails.
 */
module.exports.validateDescription = function (data) {
  return _validate(data, descriptionSchema);
};

/**
 * Validate data against rate plans json schema definition.
 *
 * @param {Object} data
 * @return {undefined}
 * @throws {ValidationError} When data validation fails.
 */
module.exports.validateRatePlans = function (data) {
  return _validate(data, ratePlansSchema);
};

/**
 * Validate data against availability json schema definition.
 *
 * @param {Object} data
 * @return {undefined}
 * @throws {ValidationError} When data validation fails.
 */
module.exports.validateAvailability = function (data) {
  return _validate(data, availabilitySchema);
};

/**
 * Validate data using the web3 library.
 *
 * @param {Object} data
 * @return {undefined}
 * @throws {ValidationError} When data validation fails.
 */
module.exports.validateWallet = function (data) {
  const wallet = wtLibs.createWallet(data);
  try {
    wallet.unlock('dummy');
  } catch (err) {
    if (err instanceof WTLibs.errors.MalformedWalletError) {
      throw new ValidationError(err.msg);
    }
  }
};

/**
 * Validate uploaders against their json schema definition.
 *
 * @param {Object} data
 * @return {undefined}
 * @throws {ValidationError} When data validation fails.
 */
module.exports.validateUploaders = function (data) {
  return _validate(data, uploadersSchema);
};

module.exports.ValidationError = ValidationError;
