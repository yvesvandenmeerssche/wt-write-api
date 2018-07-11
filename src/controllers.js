const _ = require('lodash');

const { HttpValidationError, HttpBadRequestError,
  HttpBadGatewayError } = require('./errors');
const { validateDescription, validateRatePlans,
  validateAvailability, ValidationError } = require('./validators');
const { parseBoolean, QueryParserError } = require('./services/query-parsers');
const { wtLibs, wtIndexAddress } = require('./config');

const DATA_INDEX_FIELDS = [
  { name: 'description', required: true, validator: validateDescription },
  { name: 'ratePlans', required: false, validator: validateRatePlans },
  { name: 'availability', required: false, validator: validateAvailability },
];
const DATA_INDEX_FIELD_NAMES = _.map(DATA_INDEX_FIELDS, 'name');

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
function _addTimestamps (body) {
  const timestampedObjects = _([
    [_.get(body, 'description')],
    _.values(_.get(body, ['description', 'roomTypes'])),
    _.values(_.get(body, ['ratePlans'])),
    [_.get(body, 'availability.latestSnapshot')],
    _.values(_.get(body, 'availability.updates')),
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

/**
 * Validate create/update request.
 *
 * @param {Object} body Request body
 * @param {Boolean} enforceRequired
 * @throw {HttpValidationError} when validation fails
 */
function _validateRequest (body, enforceRequired) {
  for (let field in body) {
    if (DATA_INDEX_FIELD_NAMES.indexOf(field) === -1) {
      throw new HttpValidationError('validationFailed', `Unknown property: ${field}`);
    }
  }
  for (let field of DATA_INDEX_FIELDS) {
    let data = body[field.name];
    if (enforceRequired && field.required && !data) {
      throw new HttpValidationError('validationFailed', `Missing property: ${field.name}`);
    }
    if (data) {
      field.validator(data);
    }
  }
}

/**
 * Add a new hotel to the WT index and store its data in an
 * off-chain storage.
 *
 */
module.exports.createHotel = async (req, res, next) => {
  // TODO: Find out if the hotel already exists?
  try {
    // 1. Validate request payload.
    _validateRequest(req.body, true);
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
    // 4. Upload the data index.
    const dataIndexUri = await req.uploaders.getUploader('root').upload(dataIndex, 'dataIndex');
    // 5. Upload the resulting data to ethereum.
    const address = await req.uploaders.onChain.upload(dataIndexUri);
    res.status(201).json({
      address: address,
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      return next(new HttpValidationError('validationFailed', err.message));
    }
    next(err);
  }
};

/**
 * Update hotel information.
 */
module.exports.updateHotel = async (req, res, next) => {
  try {
    // 1. Validate request.
    _validateRequest(req.body, false);
    // 2. Add `updatedAt` timestamps.
    _addTimestamps(req.body);
    // 3. Upload the changed data parts.
    let dataIndex = {};
    for (let field of DATA_INDEX_FIELDS) {
      let data = req.body[field.name];
      if (!data) {
        continue;
      }
      let uploader = req.uploaders.getUploader(field.name);
      dataIndex[`${field.name}Uri`] = await uploader.upload(data, field.name);
    }
    // TODO: Find out if the data index and/or on-chain record need to be changed as well.
    res.sendStatus(204);
  } catch (err) {
    if (err instanceof ValidationError) {
      return next(new HttpValidationError('validationFailed', err.message));
    }
    next(err);
  }
};

/**
 * Delete the hotel from WT index.
 *
 * If req.query.offChain is true, it also tries to delete the
 * off-chain data.
 *
 * NOTE: "Standard" off-chain storage is assumed. In case the
 * hotel was not created via this API (or with a different
 * uploader configuration), the off-chain resources will not be
 * deleted.
 *
 */
module.exports.deleteHotel = async (req, res, next) => {
  try {
    await req.uploaders.onChain.remove(req.params.address);
    if (req.query.offChain && parseBoolean(req.query.offChain)) {
      await req.uploaders.getUploader('root').remove('dataIndex');
      for (let field of DATA_INDEX_FIELDS) {
        let uploader = req.uploaders.getUploader(field.name);
        await uploader.remove(field.name);
      }
    }
    res.sendStatus(204);
  } catch (err) {
    if (err instanceof QueryParserError) {
      return next(new HttpBadRequestError('badRequest', err.message));
    }
    next(err);
  }
};

/**
 * Get a hotel from the WT index.
 *
 * Accepts the "fields" parameter which can specify one or more
 * comma-separated fields from DATA_INDEX_FIELDS.
 *
 * Performs validation to avoid returning broken data.
 *
 * The main purpose of this endpoint is to offer a possibility
 * to easily retrieve the current state in the correct format to
 * prepare update requests.
 */
module.exports.getHotel = async (req, res, next) => {
  try {
    const fields = _.filter((req.query.fields || '').split(','));
    for (let field of fields) {
      if (DATA_INDEX_FIELD_NAMES.indexOf(field) === -1) {
        throw new HttpValidationError('validationFailed', `Unknown field: ${field}`);
      }
    }
    const index = await wtLibs.getWTIndex(wtIndexAddress);
    const hotel = await index.getHotel(req.params.address);
    const dataIndex = await hotel.dataIndex;
    let data = {};
    for (let field of DATA_INDEX_FIELDS) {
      if (fields.length === 0 || fields.indexOf(field.name) !== -1) {
        data[`${field.name}`] = await dataIndex[`${field.name}Uri`];
      }
    }
    _validateRequest(data, fields.length > 0);
    res.status(200).json(data);
  } catch (err) {
    if (err instanceof ValidationError) {
      let msg = 'Invalid upstream response - hotel data is not valid.';
      return next(new HttpBadGatewayError('badGateway', msg));
    }
    next(err);
  }
};
