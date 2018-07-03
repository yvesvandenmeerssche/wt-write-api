const AWS = require('aws-sdk');
const shortid = require('shortid');

/**
 * Base class for all off-chain uploaders.
 */
class OffChainUploader {
  /**
   * @param {Object} data Hotel data to be uploaded.
   * @return {Promise<string>} URL of the uploaded data.
   */
  upload (data) {
    return Promise.reject(new Error('Not implemented'));
  }
};

/**
 * A dummy implementation of off-chain uploader that doesn't
 * actually do anything - useful for testing.
 */
class DummyUploader extends OffChainUploader {
  upload (data) {
    return Promise.resolve('dummy://dummy');
  }
};

/**
 * Uploader for Amazon AWS S3.
 */
class S3Uploader extends OffChainUploader {
  constructor (options) {
    for (let attr of ['accessKeyId', 'secretAccessKey', 'region', 'bucket']) {
      if (!options || !options[attr]) {
        throw new Error(`Missing required option: ${attr}.`);
      }
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
  }

  upload (data) {
    const key = `${shortid.generate()}.json`,
      params = {
        Bucket: this._bucket,
        Key: key,
        Body: JSON.stringify(data),
      };
    return this._s3.putObject(params)
      .promise()
      .then(() => `https://${this._bucket}.s3.amazonaws.com/${key}`);
  }
};

module.exports = {
  OffChainUploader: OffChainUploader,
  DummyUploader: DummyUploader,
  S3Uploader: S3Uploader,
};
