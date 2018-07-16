const { HttpValidationError } = require('../errors');
const { validateWallet, validateUploaders,
  ValidationError } = require('../services/validators');
const Profile = require('../models/profile');

const PROFILE_FIELDS = [
  { name: 'wallet', validator: validateWallet },
  { name: 'uploaders', validator: validateUploaders },
];

function _validateRequest(body) {
  for (let field of PROFILE_FIELDS) {
    if (! body[field.name]) {
      throw new HttpValidationError('validationFailed', `Missing required property: ${field.name}`);
    }
    field.validator(body[field.name]);
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
    let profileKey = await Profile.create({
      wallet: req.body.wallet,
      uploaderConfig: req.body.uploaders
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
