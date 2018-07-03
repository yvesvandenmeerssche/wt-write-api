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
        };
      });
    });

    after(() => {
      AWS.S3.restore();
    });

    it('should create a new instance with the correct options', () => {
      new S3Uploader({
        accessKeyId: 'dummy',
        secretAccessKey: 'dummy',
        bucket: 'bucket',
        region: 'eu-central-1',
      });
    });

    it('should fail when a required option is missing', () => {
      assert.throws(() => {
        new S3Uploader({
          // accessKeyId: 'dummy',
          secretAccessKey: 'dummy',
          bucket: 'bucket',
          region: 'eu-central-1',
        });
      }, /Missing required option: accessKeyId/);
    });

    it('should upload data to S3 and return the resulting URL', async () => {
      const uploader = new S3Uploader({
        accessKeyId: 'dummy',
        secretAccessKey: 'dummy',
        bucket: 'bucket',
        region: 'eu-central-1',
      });
      uploader._s3.putObject.resetHistory();
      return uploader.upload({ key: 'value' }).then((url) => {
        assert.equal(url.indexOf('https://bucket.s3.amazonaws.com/'), 0);
        assert.ok(uploader._s3.putObject.calledOnce);
        assert.equal(uploader._s3.putObject.args[0][0].Bucket, 'bucket');
        assert.equal(uploader._s3.putObject.args[0][0].Body, '{"key":"value"}');
        assert.ok(uploader._s3.putObject.args[0][0].Key);
      });
    });

    it('should always upload to a new place', async () => {
      const uploader = new S3Uploader({
        accessKeyId: 'dummy',
        secretAccessKey: 'dummy',
        bucket: 'bucket',
        region: 'eu-central-1',
      });
      const url1 = await uploader.upload({ key: 'value' });
      const url2 = await uploader.upload({ key: 'value' });

      assert.notEqual(url1, url2);
    });
  });
});
