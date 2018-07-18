const _ = require('lodash');

const { HttpValidationError, HttpBadRequestError,
  HttpBadGatewayError } = require('../errors');
const { ValidationError } = require('../services/validators');
const { parseBoolean, QueryParserError } = require('../services/query-parsers');
const WT = require('../services/wt');

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
    if (WT.DATA_INDEX_FIELD_NAMES.indexOf(field) === -1) {
      throw new HttpValidationError('validationFailed', `Unknown property: ${field}`);
    }
  }
  for (let field of WT.DATA_INDEX_FIELDS) {
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
  try {
    const wt = WT.get();
    const profile = req.profile;
    // 1. Validate request payload.
    _validateRequest(req.body, true);
    // 2. Add `updatedAt` timestamps.
    _addTimestamps(req.body);
    // 3. Upload the actual data parts.
    let dataIndex = {},
      uploading = [];
    for (let field of WT.DATA_INDEX_FIELDS) {
      let data = req.body[field.name];
      if (!data) {
        continue;
      }
      let uploader = profile.uploaders.getUploader(field.name);
      uploading.push((async () => {
        dataIndex[`${field.name}Uri`] = await uploader.upload(data, field.name);
      })());
    }
    await Promise.all(uploading);
    // 4. Upload the data index.
    const dataIndexUri = await profile.uploaders.getUploader('root').upload(dataIndex, 'dataIndex');
    // 5. Upload the resulting data to ethereum.
    const address = await wt.upload(profile.withWallet, dataIndexUri);
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
    const profile = req.profile,
      wt = WT.get();
    // 1. Validate request.
    _validateRequest(req.body, false);
    // 2. Add `updatedAt` timestamps.
    _addTimestamps(req.body);
    // 3. Upload the changed data parts.
    let dataIndex = {},
      uploading = [];
    for (let field of WT.DATA_INDEX_FIELDS) {
      let data = req.body[field.name];
      if (!data) {
        continue;
      }
      let uploader = profile.uploaders.getUploader(field.name);
      uploading.push((async () => {
        dataIndex[`${field.name}Uri`] = await uploader.upload(data, field.name);
      })());
    }
    await Promise.all(uploading);
    // 4. Find out if the data index and wt index need to be reuploaded.
    //
    // NOTE: This is applied only optionally as it is expensive
    // and shouldn't be necessary when all operations are done through
    // this API.
    if (req.query.forceSync && parseBoolean(req.query.forceSync)) {
      const origDataIndex = await wt.getDataIndex(req.params.address);
      const newContents = Object.assign({}, origDataIndex.contents, dataIndex);
      if (!_.isEqual(origDataIndex.contents, newContents)) {
        let uploader = profile.uploaders.getUploader('root');
        const dataIndexUri = await uploader.upload(newContents, 'dataIndex');
        if (dataIndexUri !== origDataIndex.ref) {
          await wt.upload(profile.withWallet, dataIndexUri, req.params.address);
        }
      }
    }
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
    const profile = req.profile,
      wt = WT.get();
    await wt.remove(profile.withWallet, req.params.address);
    if (req.query.offChain && parseBoolean(req.query.offChain)) {
      await profile.uploaders.getUploader('root').remove('dataIndex');
      let deleting = [];
      for (let field of WT.DATA_INDEX_FIELDS) {
        let uploader = profile.uploaders.getUploader(field.name);
        deleting.push((async () => {
          await uploader.remove(field.name);
        })());
      }
      await Promise.all(deleting);
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
 * comma-separated fields from WT.DATA_INDEX_FIELDS.
 *
 * Performs validation to avoid returning broken data.
 *
 * The main purpose of this endpoint is to offer a possibility
 * to easily retrieve the current state in the correct format to
 * prepare update requests.
 */
module.exports.getHotel = async (req, res, next) => {
  try {
    const fields = _.filter((req.query.fields || '').split(',')),
      wt = WT.get();
    for (let field of fields) {
      if (WT.DATA_INDEX_FIELD_NAMES.indexOf(field) === -1) {
        throw new HttpValidationError('validationFailed', `Unknown field: ${field}`);
      }
    }
    const fieldNames = _(WT.DATA_INDEX_FIELDS)
      .map('name')
      .filter((name) => (fields.length === 0 || fields.indexOf(name) !== -1))
      .value();
    const data = await wt.getDocuments(req.params.address, fieldNames);
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
