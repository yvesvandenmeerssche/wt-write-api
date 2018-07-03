const tv4 = require('tv4');
const tv4Formats = require('tv4-formats');
const countryCodes = require('iso-3166-1-alpha-2')

const descriptionSchema = require('./description-schema.json');
const ratePlansSchema = require('./rateplans-schema.json');
const availabilitySchema = require('./availability-schema.json');
const { HttpValidationError } = require('../errors');

tv4.addFormat(tv4Formats);
tv4.addFormat('country-code', (data) => {
  if (typeof data === 'string' && countryCodes.getCountry(data)) {
    return null;
  }
  return "Not a valid ISO 3166-1 alpha-2 code.";
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
