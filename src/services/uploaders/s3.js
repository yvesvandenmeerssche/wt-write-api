const AWS = require('aws-sdk');
const shortid = require('shortid');

const { HttpForbiddenError, HttpBadGatewayError } = require('../../errors');
const { OffChainUploader } = require('./base');

const S3_URL_REGEX = /^https?:\/\/([^.]+).s3.amazonaws.com\/(.+)$/;

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
   * Generate AWS object key for the given document label.
   */
  _generateKey (label) {
    const filename = `${label}_${shortid.generate()}.json`;
    if (this._keyPrefix) {
      return `${this._keyPrefix}/${filename}`;
    }
    return filename;
  }

  /**
   * Split URL into a `bucket` and `key` pair.
   * Return "undefined' if not possible.
   */
  _decode (url) {
    const match = url.match(S3_URL_REGEX);
    return match && {
      bucket: match[1],
      keyPrefix: match[2].split('/').slice(0, -1).join('/'),
      key: match[2],
    };
  }

  /**
   * Return true if the given url is in this uploader's scope,
   * false otherwise.
   *
   * @param {Object} decodedUrl Output from the _decode
   * function.
   * @return {Boolean}
   */
  _isInScope (decodedUrl) {
    if (!decodedUrl) {
      return false;
    }
    const bucketAgrees = decodedUrl.bucket === this._bucket,
      keyPrefixAgrees = decodedUrl.keyPrefix === (this._keyPrefix || '');
    return bucketAgrees && keyPrefixAgrees;
  }

  async upload (data, label, preferredUrl) {
    await super.upload(data, label);
    const decodedUrl = preferredUrl && this._decode(preferredUrl);
    let key;
    if (this._isInScope(decodedUrl)) {
      key = decodedUrl.key; // The preferredUrl can be reused.
    } else {
      key = this._generateKey(label);
    }
    const params = {
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

  async remove (url) {
    const decodedUrl = this._decode(url);
    if (!this._isInScope(decodedUrl)) {
      return false;
    }
    try {
      await this._s3.deleteObject({
        Bucket: this._bucket,
        Key: decodedUrl.key,
      }).promise();
    } catch (err) {
      this._handleUpstreamError(err);
    }
    return true;
  }
};

module.exports = {
  S3Uploader,
};
