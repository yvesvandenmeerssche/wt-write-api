/* eslint-env mocha */
const { assert } = require('chai');
const request = require('supertest');
const sinon = require('sinon');

const { getDescription, getRatePlans,
  getAvailability, getWallet } = require('../utils/fixtures');
const Profile = require('../../src/models/profile');
const config = require('../../src/config');
const WT = require('../../src/services/wt');
const { UploaderConfig } = require('../../src/services/uploaders');

const offChainUploader = {
  upload: sinon.stub().callsFake((data, label) => {
    return `dummy://${label}.json`;
  }),
  remove: sinon.spy()
};


describe('controllers - hotels', function () {
  let server;
  const description = getDescription();
  const ratePlans = getRatePlans();
  const availability = getAvailability();
  let wtMock;
  let originalWT;
  let accessKey;

  before(async () => {
    server = require('../../src/index');
    originalWT = WT.get();
    sinon.stub(UploaderConfig, 'fromProfile').callsFake(() => {
      return new UploaderConfig({ root: offChainUploader });
    });

    accessKey = await Profile.create({
      wallet: getWallet(),
      uploaderConfig: {
        root: {
          dummy: {},
        }
      }
    });

    // Mock WT.
    wtMock = {
      createWallet: () => {
        return Promise.resolve({
          lock: () => undefined,
          unlock: () => undefined,
        });
      },
      getDataIndex: (hotelAddress) => {
        return {
          ref: (hotelAddress === '0xchanged') ? 'dummy://obsolete.json' : 'dummy://dataIndex.json',
          contents: {
            descriptionUri: (hotelAddress === '0xchanged') ? 'dummy://changed-description.json' : 'dummy://description.json',
            ratePlansUri: 'dummy://ratePlans.json',
            availabilityUri: 'dummy://availability.json',
          },
        };
      },
      getDocuments: (hotelAddress, fieldNames) => {
        let desc = description;
        if (hotelAddress === '0xinvalid') {
          desc = Object.assign({}, desc);
          delete desc.name;
        }
        const ret = {
          description: desc,
          ratePlans: ratePlans,
          availability: availability,
        };
        for (let key in ret) {
          if (fieldNames.indexOf(key) === -1) {
            delete ret[key];
          }
        }
        return ret;
      },
      upload: sinon.stub().callsFake(() => Promise.resolve('dummyAddress')),
      remove: sinon.stub().callsFake(() => Promise.resolve()),
    };
    WT.set(wtMock);
  });

  after(() => {
    WT.set(originalWT);
    server.close();
    UploaderConfig.fromProfile.restore();
  });

  describe('POST /hotel', () => {
    it('should upload the given data and return the on-chain address', (done) => {
      const desc = getDescription(),
        ratePlans = getRatePlans(),
        availability = getAvailability();
      offChainUploader.upload.resetHistory();
        
      request(server)
        .post('/hotel')
        .set('X-Access-Key', accessKey)
        .set('X-Wallet-Password', 'windingtree')
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
            assert.ok(wtMock.upload.calledOnce);
            assert.equal(wtMock.upload.getCall(0).args[1], 'dummy://dataIndex.json');
            assert.equal(offChainUploader.upload.callCount, 4);
            assert.ok(offChainUploader.upload.calledWith({
              descriptionUri: 'dummy://description.json',
              ratePlansUri: 'dummy://ratePlans.json',
              availabilityUri: 'dummy://availability.json',
            }));
            assert.ok(offChainUploader.upload.calledWith(desc));
            assert.ok(offChainUploader.upload.calledWith(ratePlans));
            assert.ok(offChainUploader.upload.calledWith(availability));
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
        .set('X-Access-Key', accessKey)
        .set('X-Wallet-Password', 'windingtree')
        .send({ description: getDescription() })
        .expect(201)
        .end(done);
    });

    it('should return 401 when authorization headers are missing', (done) => {
      request(server)
        .post('/hotel')
        .send({ description: getDescription() })
        .expect(401)
        .end(done);
    });

    it('should return 422 when description is missing', (done) => {
      request(server)
        .post('/hotel')
        .set('X-Access-Key', accessKey)
        .set('X-Wallet-Password', 'windingtree')
        .send({ ratePlans: getRatePlans(), availability: getAvailability() })
        .expect(422)
        .end(done);
    });

    it('should return 422 when data format is wrong', (done) => {
      let desc = getDescription();
      delete desc.name;
      request(server)
        .post('/hotel')
        .set('X-Access-Key', accessKey)
        .set('X-Wallet-Password', 'windingtree')
        .send({ description: desc })
        .expect(422)
        .end(done);
    });

    it('should return 422 when unexpected top-level properties are present', (done) => {
      request(server)
        .post('/hotel')
        .set('X-Access-Key', accessKey)
        .set('X-Wallet-Password', 'windingtree')
        .send({ description: getDescription(), religion: 'pagan' })
        .expect(422)
        .end(done);
    });

    it('should add updatedAt timestamps when omitted', (done) => {
      let description = getDescription(),
        ratePlans = getRatePlans(),
        availability = getAvailability();
      offChainUploader.upload.resetHistory();
      delete description.updatedAt;
      delete ratePlans.basic.updatedAt;
      delete availability.latestSnapshot.updatedAt;
      request(server)
        .post('/hotel')
        .send({ description, ratePlans, availability })
        .set('X-Access-Key', accessKey)
        .set('X-Wallet-Password', 'windingtree')
        .expect(201)
        .end((err, res) => {
          if (err) return done(err);
          try {
            let uploadedDesc = offChainUploader.upload.args[0][0];
            let uploadedRatePlans = offChainUploader.upload.args[1][0];
            let uploadedAvailability = offChainUploader.upload.args[2][0];
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
      offChainUploader.upload.resetHistory();
      wtMock.upload.resetHistory();

      request(server)
        .patch('/hotel/dummy')
        .set('X-Access-Key', accessKey)
        .set('X-Wallet-Password', 'windingtree')
        .send({
          description: desc,
          ratePlans: ratePlans,
        })
        .expect(204)
        .end((err, res) => {
          if (err) return done(err);
          try {
            assert.equal(wtMock.upload.callCount, 0);
            assert.equal(offChainUploader.upload.callCount, 2);
            assert.ok(offChainUploader.upload.calledWith(desc));
            assert.ok(offChainUploader.upload.calledWith(ratePlans));
            done();
          } catch (e) {
            done(e);
          }
        });
    });

    it('should update data index and on-chain record if requested and necessary', (done) => {
      offChainUploader.upload.resetHistory();
      wtMock.upload.resetHistory();

      request(server)
        .patch('/hotel/0xchanged?forceSync=1')
        .set('X-Access-Key', accessKey)
        .set('X-Wallet-Password', 'windingtree')
        .send({ description })
        .expect(204)
        .end((err, res) => {
          if (err) return done(err);
          try {
            assert.equal(wtMock.upload.callCount, 1);
            assert.equal(wtMock.upload.getCall(0).args[1], 'dummy://dataIndex.json');
            assert.equal(wtMock.upload.getCall(0).args[2], '0xchanged');
            assert.equal(offChainUploader.upload.callCount, 2);
            assert.equal(offChainUploader.upload.args[0][1], 'description');
            assert.equal(offChainUploader.upload.args[1][1], 'dataIndex');
            done();
          } catch (e) {
            done(e);
          }
        });
    });

    it('should not update data index and on-chain record if not necessary even if requested', (done) => {
      offChainUploader.upload.resetHistory();
      wtMock.upload.resetHistory();

      request(server)
        .patch('/hotel/0xnotchanged?forceSync=1')
        .set('X-Access-Key', accessKey)
        .set('X-Wallet-Password', 'windingtree')
        .send({ description })
        .expect(204)
        .end((err, res) => {
          if (err) return done(err);
          try {
            assert.equal(wtMock.upload.callCount, 0);
            assert.equal(offChainUploader.upload.callCount, 1);
            assert.equal(offChainUploader.upload.args[0][1], 'description');
            done();
          } catch (e) {
            done(e);
          }
        });
    });

    it('should return 401 when authorization headers are missing', (done) => {
      const desc = getDescription(),
        ratePlans = getRatePlans();
      request(server)
        .patch('/hotel/dummy')
        .send({ description: desc, ratePlans: ratePlans })
        .expect(401)
        .end(done);
    });

    it('should return 422 when data format is wrong', (done) => {
      const desc = getDescription(),
        ratePlans = getRatePlans();
      delete desc.name;
      request(server)
        .patch('/hotel/dummy')
        .set('X-Access-Key', accessKey)
        .set('X-Wallet-Password', 'windingtree')
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
        .set('X-Access-Key', accessKey)
        .set('X-Wallet-Password', 'windingtree')
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
      wtMock.remove.resetHistory();
      offChainUploader.remove.resetHistory();
      request(server)
        .delete('/hotel/0xdummy')
        .set('X-Access-Key', accessKey)
        .set('X-Wallet-Password', 'windingtree')
        .expect(204)
        .end((err, res) => {
          if (err) return done(err);
          try {
            assert.ok(wtMock.remove.calledOnce);
            assert.equal(wtMock.remove.args[0][1], '0xdummy');
            assert.equal(offChainUploader.remove.callCount, 0);
            done();
          } catch (e) {
            done(e);
          }
        });
    });

    it('should delete the hotel also from the off-chain storage if requested', (done) => {
      wtMock.remove.resetHistory();
      offChainUploader.remove.resetHistory();
      request(server)
        .delete('/hotel/0xdummy?offChain=1')
        .set('X-Access-Key', accessKey)
        .set('X-Wallet-Password', 'windingtree')
        .expect(204)
        .end((err, res) => {
          if (err) return done(err);
          try {
            assert.ok(wtMock.remove.calledOnce);
            assert.equal(wtMock.remove.args[0][1], '0xdummy');
            assert.equal(offChainUploader.remove.callCount, 4);
            assert.ok(offChainUploader.remove.calledWith('dataIndex'));
            assert.ok(offChainUploader.remove.calledWith('description'));
            assert.ok(offChainUploader.remove.calledWith('ratePlans'));
            assert.ok(offChainUploader.remove.calledWith('availability'));
            done();
          } catch (e) {
            done(e);
          }
        });
    });

    it('should return HTTP 400 if the offChain parameter is ambiguous', (done) => {
      request(server)
        .delete('/hotel/0xdummy?offChain=maybe')
        .set('X-Access-Key', accessKey)
        .set('X-Wallet-Password', 'windingtree')
        .expect(400)
        .end(done);
    });

    it('should return HTTP 401 if authorization headers are missing', (done) => {
      request(server)
        .delete('/hotel/0xdummy?offChain=maybe')
        .expect(401)
        .end(done);
    });
  });

  describe('GET /hotel', (done) => {
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
