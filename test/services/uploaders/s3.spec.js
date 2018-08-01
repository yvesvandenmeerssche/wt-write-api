/* eslint-disable no-new,prefer-promise-reject-errors */
const AWS = require('aws-sdk');
const { assert } = require('chai');
const sinon = require('sinon');

const { S3Uploader } = require('../../../src/services/uploaders');
const { HttpForbiddenError, HttpBadGatewayError } = require('../../../src/errors');

function _createUploader () {
  return new S3Uploader({
    accessKeyId: 'dummy',
    secretAccessKey: 'dummy',
    bucket: 'bucket',
    region: 'eu-central-1',
    keyPrefix: 'my-hotel',
  });
}

describe('uploaders', () => {
  describe('S3Uploader', () => {
    before(() => {
      let fakeAws = (params) => {
        if (params.Key.indexOf('403') !== -1) {
          // Modelled by real AWS error structure.
          return Promise.reject({ statusCode: 403, message: 'Forbidden by AWS' });
        } else if (params.Key.indexOf('500') !== -1) {
          return Promise.reject({ statusCode: 500, message: 'AWS panicked' });
        }
        return Promise.resolve();
      };
      sinon.stub(AWS, 'S3').callsFake(() => {
        return {
          putObject: sinon.stub().callsFake((params) => {
            return {
              promise: () => fakeAws(params),
            };
          }),
          deleteObject: sinon.stub().callsFake((params) => {
            return {
              promise: () => fakeAws(params),
            };
          }),
        };
      });
    });

    after(() => {
      AWS.S3.restore();
    });
    describe('constructor()', () => {
      it('should create a new instance with the correct options', () => {
        _createUploader();
      });

      it('should fail when a required option is missing', () => {
        assert.throws(() => {
          new S3Uploader({
            // accessKeyId: 'dummy',
            secretAccessKey: 'dummy',
            bucket: 'bucket',
            region: 'eu-central-1',
            keyPrefix: 'my-hotel',
          });
        }, /Missing required option: accessKeyId/);
      });
    });

    describe('upload()', () => {
      it('should upload data to the given URL in S3', async () => {
        const uploader = _createUploader();
        uploader._s3.putObject.resetHistory();
        const preferredUrl = 'https://bucket.s3.amazonaws.com/my-hotel/description.json';
        const url = await uploader.upload({ key: 'value' }, 'description', preferredUrl);
        assert.equal(url, preferredUrl);
        assert.ok(uploader._s3.putObject.calledOnce);
        assert.deepEqual(uploader._s3.putObject.args[0][0], {
          ACL: 'public-read',
          Bucket: 'bucket',
          Body: '{"key":"value"}',
          Key: 'my-hotel/description.json',
        });
      });

      it('should work well without a keyPrefix', async () => {
        const uploader = new S3Uploader({
          accessKeyId: 'dummy',
          secretAccessKey: 'dummy',
          bucket: 'bucket',
          region: 'eu-central-1',
        });
        const preferredUrl = 'https://bucket.s3.amazonaws.com/description.json';
        uploader._s3.putObject.resetHistory();
        const url = await uploader.upload({ key: 'value' }, 'description', preferredUrl);
        assert.equal(url, preferredUrl);
        assert.equal(uploader._s3.putObject.args[0][0].Key, 'description.json');
      });

      it('should generate a suitable URL if no preferredUrl is given', async () => {
        const uploader = _createUploader();
        uploader._s3.putObject.resetHistory();
        const url = await uploader.upload({ key: 'value' }, 'description');
        assert.match(url, /https:\/\/bucket.s3.amazonaws.com\/my-hotel\/description_.+\.json/);
        assert.match(uploader._s3.putObject.args[0][0].Key, /my-hotel\/description_.+\.json/);
      });

      it('should generate a URL if the preferred one is out of scope for the uploader', async () => {
        const uploader = _createUploader();
        uploader._s3.putObject.resetHistory();
        const url = await uploader.upload({ key: 'value' }, 'description', 'https://another.s3.amazonaws.com/dummy.json');
        assert.match(url, /https:\/\/bucket.s3.amazonaws.com\/my-hotel\/description_.+\.json/);
        assert.match(uploader._s3.putObject.args[0][0].Key, /my-hotel\/description_.+\.json/);
      });

      it('should generate a URL if the key prefix is different from uploader configuration', async () => {
        const uploader = _createUploader();
        uploader._s3.putObject.resetHistory();
        const url = await uploader.upload({ key: 'value' }, 'description', 'https://bucket.s3.amazonaws.com/description.json');
        assert.match(url, /https:\/\/bucket.s3.amazonaws.com\/my-hotel\/description_.+\.json/);
        assert.match(uploader._s3.putObject.args[0][0].Key, /my-hotel\/description_.+\.json/);
      });

      it('should throw a HttpForbiddenError if AWS credentials are not right', async () => {
        const uploader = _createUploader();
        try {
          await uploader.upload({ key: 'value' }, '403');
          throw new Error('Should have raised an error');
        } catch (err) {
          assert.instanceOf(err, HttpForbiddenError);
          assert.match(err.message, /Forbidden by AWS/);
        }
      });

      it('should throw a HttpBadGatewayError if AWS panics', async () => {
        const uploader = _createUploader();
        try {
          await uploader.upload({ key: 'value' }, '500');
          throw new Error('Should have raised an error');
        } catch (err) {
          assert.instanceOf(err, HttpBadGatewayError);
          assert.match(err.message, /AWS panicked/);
        }
      });
    });

    describe('remove()', () => {
      it('should remove data from S3', async () => {
        const uploader = _createUploader();
        uploader._s3.deleteObject.resetHistory();
        const result = await uploader.remove('https://bucket.s3.amazonaws.com/my-hotel/ratePlans.json');
        assert.equal(result, true);
        assert.ok(uploader._s3.deleteObject.calledOnce);
        assert.equal(uploader._s3.deleteObject.args[0][0].Bucket, 'bucket');
        assert.equal(uploader._s3.deleteObject.args[0][0].Key, 'my-hotel/ratePlans.json');
      });

      it('should throw a HttpForbiddenError if AWS credentials are not right', async () => {
        const uploader = _createUploader();
        try {
          await uploader.remove('https://bucket.s3.amazonaws.com/my-hotel/403');
          throw new Error('Should have raised an error');
        } catch (err) {
          assert.instanceOf(err, HttpForbiddenError);
          assert.match(err.message, /Forbidden by AWS/);
        }
      });

      it('should throw a HttpBadGatewayError if AWS panics', async () => {
        const uploader = _createUploader();
        try {
          await uploader.remove('https://bucket.s3.amazonaws.com/my-hotel/500');
          throw new Error('Should have raised an error');
        } catch (err) {
          assert.instanceOf(err, HttpBadGatewayError);
          assert.match(err.message, /AWS panicked/);
        }
      });

      it('should return false if the URL is out of scope for the uploader', async () => {
        const uploader = _createUploader();
        const result = await uploader.remove('https://another.s3.amazonaws.com/dummy.json');
        assert.equal(result, false);
      });
    });

    describe('_decode()', () => {
      let uploader;

      before(() => {
        uploader = _createUploader();
      });

      it('should properly decode bucket and key from an existing URL', async () => {
        let url = 'https://tiger.s3.amazonaws.com/prefix/description.json';
        assert.deepEqual(uploader._decode(url), {
          bucket: 'tiger',
          key: 'prefix/description.json',
          keyPrefix: 'prefix',
        });
      });

      it('should work well without prefix', async () => {
        let url = 'https://tiger.s3.amazonaws.com/description.json';
        assert.deepEqual(uploader._decode(url), {
          bucket: 'tiger',
          key: 'description.json',
          keyPrefix: '',
        });
      });

      it('should return undefined if the URL does not come from AWS S3', async () => {
        let url = 'http://geocities.com/area51/description.json';
        assert.equal(uploader._decode(url), null);
      });
    });
  });
});
