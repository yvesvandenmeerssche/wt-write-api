/* eslint-disable no-new */
const { assert } = require('chai');
const sinon = require('sinon');

const { SwarmUploader } = require('../../../src/services/uploaders');

describe('uploaders', () => {
  describe('SwarmUploader', () => {
    describe('constructor()', () => {
      it('should create a new instance with the correct options', () => {
        new SwarmUploader({ providerUrl: 'http://dummy' });
      });

      it('should fail when providerUrl is missing', () => {
        assert.throws(() => {
          new SwarmUploader({});
        }, /Missing required option: providerUrl/);
      });
    });

    describe('upload()', () => {
      it('should upload data to swarm', async () => {
        const uploader = new SwarmUploader({ providerUrl: 'http://dummy' });
        const swarmAdapterMock = {
          upload: sinon.stub().returns(Promise.resolve('bzz-raw://dummy')),
        };
        uploader._swarmAdapter = swarmAdapterMock;
        const data = { key: 'value' };
        const url = await uploader.upload(data, 'dummy');
        assert.equal(url, 'bzz-raw://dummy');
        assert.ok(swarmAdapterMock.upload.calledOnce);
        assert.ok(swarmAdapterMock.upload.calledWithExactly(data));
      });
    });
  });
});
