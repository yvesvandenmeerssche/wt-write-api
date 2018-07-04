/* eslint-disable no-new */
const AWS = require('aws-sdk');
const { assert } = require('chai');
const sinon = require('sinon');

const S3Uploader = require('../../../src/services/uploaders/off-chain').S3Uploader;

describe('uploaders', () => {
  describe('S3Uploader', () => {
    before(() => {
      sinon.stub(AWS, 'S3').callsFake(() => {
        return {
          putObject: sinon.stub().callsFake(() => {
            return {
              promise: () => Promise.resolve(),
            };
          }),
          deleteObject: sinon.stub().callsFake(() => {
            return {
              promise: () => Promise.resolve(),
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
        new S3Uploader({
          accessKeyId: 'dummy',
          secretAccessKey: 'dummy',
          bucket: 'bucket',
          region: 'eu-central-1',
          keyPrefix: 'my-hotel',
        });
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
        const uploader = new S3Uploader({
          accessKeyId: 'dummy',
          secretAccessKey: 'dummy',
          bucket: 'bucket',
          region: 'eu-central-1',
          keyPrefix: 'my-hotel',
        });
        uploader._s3.putObject.resetHistory();
        return uploader.upload({ key: 'value' }, 'description').then((url) => {
          assert.equal(url, 'https://bucket.s3.amazonaws.com/my-hotel/description.json');
          assert.ok(uploader._s3.putObject.calledOnce);
          assert.equal(uploader._s3.putObject.args[0][0].Bucket, 'bucket');
          assert.equal(uploader._s3.putObject.args[0][0].Body, '{"key":"value"}');
          assert.equal(uploader._s3.putObject.args[0][0].Key, 'my-hotel/description.json');
        });
      });
    });

    describe('remove()', () => {
      it('should remove data from S3', async () => {
        const uploader = new S3Uploader({
          accessKeyId: 'dummy',
          secretAccessKey: 'dummy',
          bucket: 'bucket',
          region: 'eu-central-1',
          keyPrefix: 'my-hotel',
        });
        uploader._s3.deleteObject.resetHistory();
        return uploader.remove('ratePlans').then((result) => {
          assert.equal(result, true);
          assert.ok(uploader._s3.deleteObject.calledOnce);
          assert.equal(uploader._s3.deleteObject.args[0][0].Bucket, 'bucket');
          assert.equal(uploader._s3.deleteObject.args[0][0].Key, 'my-hotel/ratePlans.json');
        });
      });
    });
  });
});
