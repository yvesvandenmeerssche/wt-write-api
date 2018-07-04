const AWS = require('aws-sdk');

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
      'bucket', 'keyPrefix'];
    for (let attr of requiredOptions) {
      if (!options || !options[attr]) {
        throw new Error(`Missing required option: ${attr}.`);
      }
    }
    if (options.keyPrefix.endsWith('/')) {
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

  upload (data, label) {
    super.upload(data, label);
    const key = `${this._keyPrefix}/${label}.json`,
      params = {
        Bucket: this._bucket,
        Key: key,
        Body: JSON.stringify(data),
      };
    return this._s3.putObject(params)
      .promise()
      .then(() => `https://${this._bucket}.s3.amazonaws.com/${key}`);
  }

  remove (label) {
    const key = `${this._keyPrefix}/${label}.json`,
      params = { Bucket: this._bucket, Key: key };
    return this._s3.deleteObject(params)
      .promise()
      .then(() => true);
  }
};

module.exports = {
  OffChainUploader: OffChainUploader,
  DummyUploader: DummyUploader,
  S3Uploader: S3Uploader,
};
