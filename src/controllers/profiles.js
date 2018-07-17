const { HttpValidationError } = require('../errors');
const { ValidationError } = require('../services/validators');
const Profile = require('../models/profile');

const PROFILE_FIELDS = ['wallet', 'uploaders'];

function _validateRequest (body) {
  for (let field of PROFILE_FIELDS) {
    if (!body[field]) {
      throw new HttpValidationError('validationFailed', `Missing required property: ${field}`);
    }
  }
  for (let field in body) {
    if (PROFILE_FIELDS.indexOf(field) === -1) {
      throw new HttpValidationError('validationFailed', `Unknown property: ${field}`);
    }
  }
}

/**
 * Create a new profile.
 */
module.exports.createProfile = async (req, res, next) => {
  try {
    // 1. Validate request payload.
    _validateRequest(req.body);
    // 2. Save profile.
    // (Note: validation of wallet and uploader contents is done
    // here as well.)
    let profileKey = await Profile.create({
      wallet: req.body.wallet,
      uploaders: req.body.uploaders,
    });
    // 3. Return the access key.
    res.status(201).json({ accessKey: profileKey });
  } catch (err) {
    if (err instanceof ValidationError) {
      return next(new HttpValidationError('validationFailed', err.message));
    }
    next(err);
  }
};
