const _ = require('lodash');
const tv4 = require('tv4');
const tv4Formats = require('tv4-formats');
const countryCodes = require('iso-3166-1-alpha-2');
const timezones = require('timezones.json');

const descriptionSchema = require('./description-schema.json');
const ratePlansSchema = require('./rateplans-schema.json');
const availabilitySchema = require('./availability-schema.json');
const { HttpValidationError } = require('../errors');

const TIMEZONES = new Set(_(timezones).map('utc').flatten().value());

tv4.addFormat(tv4Formats); // We use the "date-time" format from this module.
tv4.addFormat('country-code', (data) => {
  if (countryCodes.getCountry(data)) {
    return null;
  }
  return "Not a valid ISO 3166-1 alpha-2 code.";
});
tv4.addFormat('timezone', (data) => {
  if (TIMEZONES.has(data)) {
    return null;
  }
  return "Not a valid timezone.";
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
    throw new HttpValidationError('validationFailed', msg);
  }
}

/**
 * Validate data against description json schema definition.
 *
 * @param {Object} data
 * @return {undefined}
 * @throws {errors.HttpValidationError} When data validation fails.
 */
module.exports.validateDescription = function (data) {
  return _validate(data, descriptionSchema);
};

/**
 * Validate data against rate plans json schema definition.
 *
 * @param {Object} data
 * @return {undefined}
 * @throws {errors.HttpValidationError} When data validation fails.
 */
module.exports.validateRatePlans = function (data) {
  return _validate(data, ratePlansSchema);
};

/**
 * Validate data against availability json schema definition.
 *
 * @param {Object} data
 * @return {undefined}
 * @throws {errors.HttpValidationError} When data validation fails.
 */
module.exports.validateAvailability = function (data) {
  return _validate(data, availabilitySchema);
};
