const AWS = require('aws-sdk');

const { HttpForbiddenError, HttpBadGatewayError } = require('../errors');

/**
 * Base class for all off-chain uploaders.
 */
class OffChainUploader {
  /**
   * Upload data to an off-chain storage.
   *
   * @param {Object} data Hotel data to be uploaded.
   * @param {string} label To be used to create the final URL,
   *   if possible. (Serves for re-using URLs to avoid the need
   *   of updating on-chain data.)
   * @return {Promise<string>} URL of the uploaded data.
   */
  upload (data, label) {
    if (!data) {
      throw new Error('Please provide the data to be uploaded.');
    }
    if (!label) {
      throw new Error('Please provide a label for the data.');
    }
    // NOTE: implement the rest in the subclasses.
  }

  /**
   * Remove data from an off-chain storage, if possible.
   *
   * @param {string} label Used to identify the data to be
   *   removed.
   * @return {Promise<Boolean>} A Promise of the deletion result
   *    - true if deletion was possible, false otherwise.
   */
  remove (label) {
    return Promise.resolve(false);
  }
};

/**
 * A dummy implementation of off-chain uploader that doesn't
 * actually do anything - useful for testing.
 */
class DummyUploader extends OffChainUploader {
  upload (data, label) {
    super.upload(data, label);
    return Promise.resolve(`dummy://${label}.json`);
  }
};

/**
 * Uploader for Amazon AWS S3.
 */
class S3Uploader extends OffChainUploader {
  /**
   * The following configuration must be provided:
   * - accessKeyId, secretAccessKey: AWS credentials
   * - region: AWS region
   * - bucket: S3 bucket to upload to
   * - keyPrefix: a prefix ("directory") to upload hotel data
   *     to. Serves to differentiate between different hotels
   *     stored in the same s3 bucket.
   */
  constructor (options) {
    const requiredOptions = ['accessKeyId', 'secretAccessKey', 'region',
      'bucket'];
    for (let attr of requiredOptions) {
      if (!options || !options[attr]) {
        throw new Error(`Missing required option: ${attr}.`);
      }
    }
    if (options.keyPrefix && options.keyPrefix.endsWith('/')) {
      throw new Error(`Invalid keyPrefix - cannot end with '/': ${options.keyPrefix}`);
    }
    super();
    this._s3 = new AWS.S3({
      credentials: new AWS.Credentials({
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      }),
      apiVersion: '2006-03-01',
      region: options.region,
    });
    this._bucket = options.bucket;
    this._keyPrefix = options.keyPrefix;
  }

  /**
   * Wrap well-defined errors from AWS in our http errors.
   */
  _handleUpstreamError (err) {
    if (err.statusCode === 403) {
      let msg = `Forbidden by upstream (AWS): ${err.message}`;
      throw new HttpForbiddenError('forbidden', msg);
    }
    if (err.statusCode >= 500) {
      let msg = `Invalid response from upstream (AWS): ${err.message}`;
      throw new HttpBadGatewayError('badGatewayError', msg);
    }
    throw err;
  }

  /**
   * Get AWS object key for the given document label.
   */
  _getKey (label) {
    if (this._keyPrefix) {
      return `${this._keyPrefix}/${label}.json`;
    }
    return `${label}.json`;
  }

  async upload (data, label) {
    super.upload(data, label);
    const key = this._getKey(label),
      params = {
        Bucket: this._bucket,
        Key: key,
        Body: JSON.stringify(data),
      };
    try {
      await this._s3.putObject(params).promise();
    } catch (err) {
      this._handleUpstreamError(err);
    }
    return `https://${this._bucket}.s3.amazonaws.com/${key}`;
  }

  async remove (label) {
    const key = this._getKey(label),
      params = { Bucket: this._bucket, Key: key };
    try {
      await this._s3.deleteObject(params).promise();
    } catch (err) {
      this._handleUpstreamError(err);
    }
    return true;
  }
};

/**
 * Specific combination of off-chain uploaders to be used.
 */
class UploaderConfig {
  /**
   * @param {Object} uploaders Mapping of dot-separated
   *                 field paths to OffChainUploader instances.
   */
  constructor (uploaders) {
    if (!uploaders || !uploaders.root) {
      throw new Error('No default (`root`) offchain uploader specified!');
    }
    this.uploaders = uploaders;
  }

  /**
   * Create an UploaderConfig instance from profile data.
   *
   * @param {Object} profile
   */
  static fromProfile (profile) {
    const config = profile.uploaders;
    let opts = {};
    for (let documentKey in config) {
      const uploaderKey = Object.keys(config[documentKey])[0];
      opts[documentKey] = new ({
        dummy: DummyUploader,
        s3: S3Uploader,
      }[uploaderKey])(config[documentKey][uploaderKey]);
    }
    return new UploaderConfig(opts);
  }

  /**
   * Get off-chain uploader for the specified data subtree.
   */
  getUploader (subtree) {
    return this.uploaders[subtree] || this.uploaders.root;
  }
};

module.exports = {
  OffChainUploader,
  DummyUploader,
  S3Uploader,
  UploaderConfig,
};
