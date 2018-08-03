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
const { wtLibs, allowedUploaders } = require('../../config');

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

tv4.setErrorReporter((error, data, schema) => {
  // Better error messages for some common error cases.
  if (schema === uploadersSchema.definitions.uploader &&
      error.code === tv4.errorCodes.ONE_OF_MISSING) {
    return 'Invalid uploader configuration';
  }
  if (schema === uploadersSchema.definitions.uploader &&
      error.code === tv4.errorCodes.ONE_OF_MULTIPLE) {
    return 'Only one uploader can be configured per document';
  }
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
  if (!(data instanceof Object)) { // This case is not handled by the "unlock" method.
    throw new ValidationError('Not a valid V3 wallet');
  }
  if (!data.address) {
    // wt-js-libs depend on this being present.
    throw new ValidationError('Not a valid V3 wallet - missing address');
  }
  const wallet = wtLibs.createWallet(data);
  try {
    wallet.unlock('dummy');
  } catch (err) {
    if (err instanceof WTLibs.errors.MalformedWalletError) {
      throw new ValidationError(err.message);
    }
  }
};

// Check if all allowed uploaders are defined in the schema and
// patch the uploaders schema to reflect allowed uploaders.
for (let key of allowedUploaders) {
  if (!uploadersSchema.definitions[key]) {
    throw new Error(`Unknown uploader in 'allowedUploaders': ${key}`);
  }
}
uploadersSchema.definitions.uploader.oneOf = allowedUploaders.map((uploader) => {
  return { '$ref': `#/definitions/${uploader}` };
});

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
