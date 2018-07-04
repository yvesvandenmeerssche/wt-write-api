const _ = require('lodash');

const { HttpValidationError } = require('./errors');
const { validateDescription, validateRatePlans,
  validateAvailability } = require('./validators');

const DATA_INDEX_FIELDS = [
  { name: 'description', required: true, validator: validateDescription },
  { name: 'ratePlans', required: false, validator: validateRatePlans },
  { name: 'availability', required: false, validator: validateAvailability },
];

/**
 * Add the `updatedAt` timestamp to the following components (if
 * present):
 *
 * - description
 * - description.roomTypes.*
 * - ratePlans.*
 * - availability.latestSnapshot
 * - availability.updates.*
 */
function _addTimestamps (data) {
  const timestampedObjects = _([
    [_.get(data, 'description')],
    _.values(_.get(data, ['description', 'roomTypes'])),
    _.values(_.get(data, ['ratePlans'])),
    [_.get(data, 'availability.latestSnapshot')],
    _.values(_.get(data, 'availability.updates')),
  ])
    .flatten()
    .filter()
    .value();
  const updatedAt = (new Date()).toISOString();
  for (let obj of timestampedObjects) {
    if (!obj.updatedAt) {
      obj.updatedAt = updatedAt;
    }
  }
}

module.exports.createHotel = async (req, res, next) => {
  try {
    // 1. Validate request.
    for (let field of DATA_INDEX_FIELDS) {
      let data = req.body[field.name];
      if (field.required && !data) {
        throw new HttpValidationError('validationFailed', `Missing field: ${field.name}`);
      }
      if (data) {
        field.validator(data);
      }
    }
    // 2. Add `updatedAt` timestamps.
    _addTimestamps(req.body);
    // 3. Upload the actual data parts.
    let dataIndex = {};
    for (let field of DATA_INDEX_FIELDS) {
      let data = req.body[field.name];
      if (!data) {
        continue;
      }
      let uploader = req.uploaders.getUploader(field.name);
      dataIndex[`${field.name}Uri`] = await uploader.upload(data, field.name);
    }
    // 3. Upload the data index.
    const dataIndexUri = await req.uploaders.getUploader('root').upload(dataIndex, 'dataIndex');
    // 4. Upload the resulting data to ethereum.
    await req.uploaders.onChain.upload(dataIndexUri);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};
