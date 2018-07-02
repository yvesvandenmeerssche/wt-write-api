/* eslint-env mocha */
/* eslint-disable no-unused-vars */
const { assert, expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');

const { getDescription, getRatePlans,
  getAvailability } = require('./utils/fixtures');
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
      const desc = getDescription(),
        ratePlans = getRatePlans(),
        availability = getAvailability();
        
      request(server)
        .post('/hotel')
        .send({
          description: desc,
          ratePlans: ratePlans,
          availability: availability,
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
            assert.ok(uploaders.offChain.root.upload.calledWith(desc));
            assert.ok(uploaders.offChain.root.upload.calledWith(ratePlans));
            assert.ok(uploaders.offChain.root.upload.calledWith(availability));
            done();
          } catch (e) {
            done(e);
          }
        });
    });

    it('should return 204 the non-required fields are missing', (done) => {
      request(server)
        .post('/hotel')
        .send({ description: getDescription() })
        .expect(204)
        .end(done);
    });

    it('should return 422 when description is missing', (done) => {
      request(server)
        .post('/hotel')
        .send({ ratePlans: getRatePlans(), availability: getAvailability() })
        .expect(422)
        .end(done);
    });

    it('should return 422 when the data format is wrong', (done) => {
      let desc = getDescription();
      delete desc.name;
      request(server)
        .post('/hotel')
        .send({ description: desc })
        .expect(422)
        .end(done);
    });
  });
});
