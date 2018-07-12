const _ = require('lodash');

const { validateDescription, validateRatePlans, validateAvailability } = require('./services/validators');

/* A declarative description of hotel data. */

const DATA_INDEX_FIELDS = [
  { name: 'description', required: true, validator: validateDescription },
  { name: 'ratePlans', required: false, validator: validateRatePlans },
  { name: 'availability', required: false, validator: validateAvailability },
];
const DATA_INDEX_FIELD_NAMES = _.map(DATA_INDEX_FIELDS, 'name');

module.exports = {
  DATA_INDEX_FIELDS,
  DATA_INDEX_FIELD_NAMES,
};
