/* eslint-disable no-new,prefer-promise-reject-errors */
const AWS = require('aws-sdk');
const { assert } = require('chai');
const sinon = require('sinon');

const S3Uploader = require('../../src/services/uploaders').S3Uploader;
const { HttpForbiddenError, HttpBadGatewayError } = require('../../src/errors');

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
      it('should upload data to S3 and return the resulting URL', async () => {
        const uploader = _createUploader();
        uploader._s3.putObject.resetHistory();
        return uploader.upload({ key: 'value' }, 'description').then((url) => {
          assert.equal(url, 'https://bucket.s3.amazonaws.com/my-hotel/description.json');
          assert.ok(uploader._s3.putObject.calledOnce);
          assert.equal(uploader._s3.putObject.args[0][0].Bucket, 'bucket');
          assert.equal(uploader._s3.putObject.args[0][0].Body, '{"key":"value"}');
          assert.equal(uploader._s3.putObject.args[0][0].Key, 'my-hotel/description.json');
        });
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
        return uploader.remove('ratePlans').then((result) => {
          assert.equal(result, true);
          assert.ok(uploader._s3.deleteObject.calledOnce);
          assert.equal(uploader._s3.deleteObject.args[0][0].Bucket, 'bucket');
          assert.equal(uploader._s3.deleteObject.args[0][0].Key, 'my-hotel/ratePlans.json');
        });
      });

      it('should throw a HttpForbiddenError if AWS credentials are not right', async () => {
        const uploader = _createUploader();
        try {
          await uploader.remove('403');
          throw new Error('Should have raised an error');
        } catch (err) {
          assert.instanceOf(err, HttpForbiddenError);
          assert.match(err.message, /Forbidden by AWS/);
        }
      });

      it('should throw a HttpBadGatewayError if AWS panics', async () => {
        const uploader = _createUploader();
        try {
          await uploader.remove('500');
          throw new Error('Should have raised an error');
        } catch (err) {
          assert.instanceOf(err, HttpBadGatewayError);
          assert.match(err.message, /AWS panicked/);
        }
      });
    });
  });
});
