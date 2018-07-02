const tv4 = require('tv4');

const descriptionSchema = require('./description-schema.json');
const ratePlansSchema = require('./rateplans-schema.json');
const availabilitySchema = require('./availability-schema.json');
const { HttpValidationError } = require('../errors');

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
