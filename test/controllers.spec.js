/* eslint-env mocha */
/* eslint-disable no-unused-vars */
const { assert, expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');

const DummyOnChainUploader = require('../src/services/uploaders/on-chain').DummyUploader;
const { uploaders } = require('../src/config');

sinon.spy(uploaders.onChain, 'upload');
sinon.spy(uploaders.offChain.root, 'upload');

describe('controllers', function () {
  let server;

  before(() => {
    server = require('../src/index');
  });

  after(() => {
    server.close();
  });

  describe('POST /hotel', () => {
    it('should upload the given data', (done) => {
      request(server)
        .post('/hotel')
        .send({
          description: { key: 'value_desc' },
          ratePlans: { key: 'value_rate' },
          availability: { key: 'value_avail' },
        })
        .expect(204)
        .end((err, res) => {
          if (err) return done(err);
          try {
            assert.ok(uploaders.onChain.upload.calledOnce);
            assert.equal(uploaders.onChain.upload.getCall(0).args[0], 'dummy://dummy');
            assert.equal(uploaders.offChain.root.upload.callCount, 4);
            assert.ok(uploaders.offChain.root.upload.calledWith({
              descriptionUri: 'dummy://dummy',
              ratePlansUri: 'dummy://dummy',
              availabilityUri: 'dummy://dummy',
            }));
            assert.ok(uploaders.offChain.root.upload.calledWith({
              key: 'value_desc',
            }));
            assert.ok(uploaders.offChain.root.upload.calledWith({
              key: 'value_rate',
            }));
            assert.ok(uploaders.offChain.root.upload.calledWith({
              key: 'value_avail',
            }));
            done();
          } catch (e) {
            done(e);
          }
        });
    });
  });
});
