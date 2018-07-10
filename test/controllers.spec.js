/* eslint-env mocha */
/* eslint-disable no-unused-vars */
const { assert, expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');

const { getDescription, getRatePlans,
  getAvailability } = require('./utils/fixtures');
const { wtLibs } = require('../src/config');
const DummyOnChainUploader = require('../src/services/uploaders/on-chain').DummyUploader;
const { uploaders } = require('../src/config');

sinon.spy(uploaders.onChain, 'upload');
sinon.spy(uploaders.onChain, 'remove');
sinon.spy(uploaders.offChain.root, 'upload');
sinon.spy(uploaders.offChain.root, 'remove');

describe('controllers', function () {
  let server;

  before(() => {
    server = require('../src/index');
  });

  after(() => {
    server.close();
  });

  describe('POST /hotel', () => {
    it('should upload the given data and return the on-chain address', (done) => {
      const desc = getDescription(),
        ratePlans = getRatePlans(),
        availability = getAvailability();
      uploaders.offChain.root.upload.resetHistory();
        
      request(server)
        .post('/hotel')
        .send({
          description: desc,
          ratePlans: ratePlans,
          availability: availability,
        })
        .expect(201)
        .expect('content-type', /application\/json/)
        .end((err, res) => {
          if (err) return done(err);
          try {
            assert.ok(uploaders.onChain.upload.calledOnce);
            assert.equal(uploaders.onChain.upload.getCall(0).args[0], 'dummy://dataIndex.json');
            assert.equal(uploaders.offChain.root.upload.callCount, 4);
            assert.ok(uploaders.offChain.root.upload.calledWith({
              descriptionUri: 'dummy://description.json',
              ratePlansUri: 'dummy://ratePlans.json',
              availabilityUri: 'dummy://availability.json',
            }));
            assert.ok(uploaders.offChain.root.upload.calledWith(desc));
            assert.ok(uploaders.offChain.root.upload.calledWith(ratePlans));
            assert.ok(uploaders.offChain.root.upload.calledWith(availability));
            assert.deepEqual(res.body, { address: 'dummyAddress' });
            done();
          } catch (e) {
            done(e);
          }
        });
    });

    it('should return 201 when only non-required fields are missing', (done) => {
      request(server)
        .post('/hotel')
        .send({ description: getDescription() })
        .expect(201)
        .end(done);
    });

    it('should return 422 when description is missing', (done) => {
      request(server)
        .post('/hotel')
        .send({ ratePlans: getRatePlans(), availability: getAvailability() })
        .expect(422)
        .end(done);
    });

    it('should return 422 when data format is wrong', (done) => {
      let desc = getDescription();
      delete desc.name;
      request(server)
        .post('/hotel')
        .send({ description: desc })
        .expect(422)
        .end(done);
    });

    it('should return 422 when unexpected top-level properties are present', (done) => {
      request(server)
        .post('/hotel')
        .send({ description: getDescription(), religion: 'pagan' })
        .expect(422)
        .end(done);
    });

    it('should add updatedAt timestamps when omitted', (done) => {
      let description = getDescription(),
        ratePlans = getRatePlans(),
        availability = getAvailability();
      uploaders.offChain.root.upload.resetHistory();
      delete description.updatedAt;
      delete ratePlans.basic.updatedAt;
      delete availability.latestSnapshot.updatedAt;
      request(server)
        .post('/hotel')
        .send({ description, ratePlans, availability })
        .expect(201)
        .end((err, res) => {
          if (err) return done(err);
          try {
            let uploadedDesc = uploaders.offChain.root.upload.args[0][0];
            let uploadedRatePlans = uploaders.offChain.root.upload.args[1][0];
            let uploadedAvailability = uploaders.offChain.root.upload.args[2][0];
            assert.ok('updatedAt' in uploadedDesc);
            assert.ok('updatedAt' in uploadedRatePlans.basic);
            assert.ok('updatedAt' in uploadedAvailability.latestSnapshot);
            done();
          } catch (e) {
            done(e);
          }
        });
    });
  });

  describe('PATCH /hotel/:address', () => {
    it('should reupload the given subtrees', (done) => {
      const desc = getDescription(),
        ratePlans = getRatePlans();
      uploaders.offChain.root.upload.resetHistory();
      uploaders.onChain.upload.resetHistory();

      request(server)
        .patch('/hotel/dummy')
        .send({
          description: desc,
          ratePlans: ratePlans,
        })
        .expect(204)
        .end((err, res) => {
          if (err) return done(err);
          try {
            assert.equal(uploaders.onChain.upload.callCount, 0);
            assert.equal(uploaders.offChain.root.upload.callCount, 2);
            assert.ok(uploaders.offChain.root.upload.calledWith(desc));
            assert.ok(uploaders.offChain.root.upload.calledWith(ratePlans));
            done();
          } catch (e) {
            done(e);
          }
        });
    });

    it('should return 422 when data format is wrong', (done) => {
      const desc = getDescription(),
        ratePlans = getRatePlans();
      delete desc.name;
      request(server)
        .patch('/hotel/dummy')
        .send({
          description: desc,
          ratePlans: ratePlans,
        })
        .expect(422)
        .end(done);
    });

    it('should return 422 when unexpected top-level properties are present', (done) => {
      request(server)
        .patch('/hotel/dummy')
        .send({
          description: getDescription(),
          ratePlans: getRatePlans(),
          religion: 'pagan',
        })
        .expect(422)
        .end(done);
    });
  });

  describe('DELETE /hotel', () => {
    it('should delete the hotel from the on-chain storage', (done) => {
      uploaders.onChain.remove.resetHistory();
      uploaders.offChain.root.remove.resetHistory();
      request(server)
        .delete('/hotel/0xdummy')
        .expect(204)
        .end((err, res) => {
          if (err) return done(err);
          try {
            assert.ok(uploaders.onChain.remove.calledOnce);
            assert.equal(uploaders.onChain.remove.args[0][0], '0xdummy');
            assert.equal(uploaders.offChain.root.remove.callCount, 0);
            done();
          } catch (e) {
            done(e);
          }
        });
    });

    it('should delete the hotel also from the off-chain storage if requested', (done) => {
      uploaders.onChain.remove.resetHistory();
      uploaders.offChain.root.remove.resetHistory();
      request(server)
        .delete('/hotel/0xdummy?offChain=1')
        .expect(204)
        .end((err, res) => {
          if (err) return done(err);
          try {
            assert.ok(uploaders.onChain.remove.calledOnce);
            assert.equal(uploaders.onChain.remove.args[0][0], '0xdummy');
            assert.equal(uploaders.offChain.root.remove.callCount, 4);
            assert.ok(uploaders.offChain.root.remove.calledWith('dataIndex'));
            assert.ok(uploaders.offChain.root.remove.calledWith('description'));
            assert.ok(uploaders.offChain.root.remove.calledWith('ratePlans'));
            assert.ok(uploaders.offChain.root.remove.calledWith('availability'));
            done();
          } catch (e) {
            done(e);
          }
        });
    });

    it('should return HTTP 400 if the offChain parameter is ambiguous', (done) => {
      request(server)
        .delete('/hotel/0xdummy?offChain=maybe')
        .expect(400)
        .end(done);
    });
  });

  describe('GET /hotel', (done) => {
    const description = getDescription();
    const ratePlans = getRatePlans();
    const availability = getAvailability();
    before(() => {
      sinon.stub(wtLibs, 'getWTIndex').callsFake(() => {
        return Promise.resolve({
          getHotel: (hotelAddress) => Promise.resolve({
            get dataIndex () {
              return {
                get descriptionUri () {
                  let desc = description;
                  if (hotelAddress === '0xinvalid') {
                    desc = Object.assign({}, desc);
                    delete desc.name;
                  }
                  return desc;
                },
                get ratePlansUri () {
                  return ratePlans;
                },
                get availabilityUri () {
                  return availability;
                },
              };
            },
          }),
        });
      });
    });

    after(() => {
      wtLibs.getWTIndex.restore();
    });

    it('should return hotel data', (done) => {
      request(server)
        .get('/hotel/0xdummy')
        .expect(200)
        .expect('content-type', /application\/json/)
        .end((err, res) => {
          if (err) return done(err);
          try {
            assert.deepEqual(res.body, {
              description: description,
              ratePlans: ratePlans,
              availability: availability,
            });
            done();
          } catch (err) {
            done(err);
          }
        });
    });

    it('should respect the `fields` query parameter', (done) => {
      request(server)
        .get('/hotel/0xdummy?fields=description,ratePlans')
        .expect(200)
        .expect('content-type', /application\/json/)
        .end((err, res) => {
          if (err) return done(err);
          try {
            assert.deepEqual(res.body, {
              description: description,
              ratePlans: ratePlans,
            });
            done();
          } catch (err) {
            done(err);
          }
        });
    });

    it('should return 422 if the fields param is unknown', (done) => {
      request(server)
        .get('/hotel/0xdummy?fields=affiliation')
        .expect(422)
        .end(done);
    });

    it('should return 502 if the upstream data are not valid', (done) => {
      request(server)
        .get('/hotel/0xinvalid')
        .expect(502)
        .end(done);
    });
  });
});
