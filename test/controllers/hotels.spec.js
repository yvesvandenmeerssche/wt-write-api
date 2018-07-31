/* eslint-env mocha */
const { assert } = require('chai');
const request = require('supertest');
const sinon = require('sinon');

const { getDescription, getRatePlans,
  getAvailability, getWallet } = require('../utils/factories');
const Account = require('../../src/models/account');
const WT = require('../../src/services/wt');
const { UploaderConfig } = require('../../src/services/uploaders');
const { ACCESS_KEY_HEADER, WALLET_PASSWORD_HEADER } = require('../../src/constants');

const offChainUploader = {
  upload: sinon.stub().callsFake(async (data, label) => {
    return `dummy://${label}.json`;
  }),
  remove: sinon.spy(),
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
    sinon.stub(UploaderConfig, 'fromAccount').callsFake(() => {
      return new UploaderConfig({ root: offChainUploader });
    });

    accessKey = (await Account.create({
      wallet: getWallet(),
      uploaders: {
        root: {
          inMemory: {},
        },
      },
    })).accessKey;

    // Mock WT.
    wtMock = {
      createWallet: () => {
        return {
          lock: () => undefined,
          unlock: () => undefined,
        };
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
    UploaderConfig.fromAccount.restore();
  });

  describe('POST /hotels', () => {
    it('should upload the given data and return the on-chain address', (done) => {
      const desc = getDescription(),
        ratePlans = getRatePlans(),
        availability = getAvailability();
      offChainUploader.upload.resetHistory();
        
      request(server)
        .post('/hotels')
        .set(ACCESS_KEY_HEADER, accessKey)
        .set(WALLET_PASSWORD_HEADER, 'windingtree')
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
            assert.ok(offChainUploader.upload.calledWithExactly(desc, 'description'));
            assert.ok(offChainUploader.upload.calledWithExactly(ratePlans, 'ratePlans'));
            assert.ok(offChainUploader.upload.calledWithExactly(availability, 'availability'));
            assert.deepEqual(res.body, { address: 'dummyAddress' });
            done();
          } catch (e) {
            done(e);
          }
        });
    });

    it('should return 201 when only non-required fields are missing', (done) => {
      request(server)
        .post('/hotels')
        .set(ACCESS_KEY_HEADER, accessKey)
        .set(WALLET_PASSWORD_HEADER, 'windingtree')
        .send({ description: getDescription() })
        .expect(201)
        .end(done);
    });

    it('should return 401 when authorization headers are missing', (done) => {
      request(server)
        .post('/hotels')
        .send({ description: getDescription() })
        .expect(401)
        .end(done);
    });

    it('should return 422 when description is missing', (done) => {
      request(server)
        .post('/hotels')
        .set(ACCESS_KEY_HEADER, accessKey)
        .set(WALLET_PASSWORD_HEADER, 'windingtree')
        .send({ ratePlans: getRatePlans(), availability: getAvailability() })
        .expect(422)
        .end(done);
    });

    it('should return 422 when data format is wrong', (done) => {
      let desc = getDescription();
      delete desc.name;
      request(server)
        .post('/hotels')
        .set(ACCESS_KEY_HEADER, accessKey)
        .set(WALLET_PASSWORD_HEADER, 'windingtree')
        .send({ description: desc })
        .expect(422)
        .end(done);
    });

    it('should return 422 when unexpected top-level properties are present', (done) => {
      request(server)
        .post('/hotels')
        .set(ACCESS_KEY_HEADER, accessKey)
        .set(WALLET_PASSWORD_HEADER, 'windingtree')
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
        .post('/hotels')
        .send({ description, ratePlans, availability })
        .set(ACCESS_KEY_HEADER, accessKey)
        .set(WALLET_PASSWORD_HEADER, 'windingtree')
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

  describe('PATCH /hotels/:address', () => {
    it('should reupload the given subtrees', (done) => {
      const desc = getDescription(),
        ratePlans = getRatePlans();
      offChainUploader.upload.resetHistory();
      wtMock.upload.resetHistory();

      request(server)
        .patch('/hotels/dummy')
        .set(ACCESS_KEY_HEADER, accessKey)
        .set(WALLET_PASSWORD_HEADER, 'windingtree')
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
            assert.ok(offChainUploader.upload.calledWithExactly(desc, 'description', 'dummy://description.json'));
            assert.ok(offChainUploader.upload.calledWithExactly(ratePlans, 'ratePlans', 'dummy://ratePlans.json'));
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
        .patch('/hotels/0xchanged?forceSync=1')
        .set(ACCESS_KEY_HEADER, accessKey)
        .set(WALLET_PASSWORD_HEADER, 'windingtree')
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
        .patch('/hotels/0xnotchanged?forceSync=1')
        .set(ACCESS_KEY_HEADER, accessKey)
        .set(WALLET_PASSWORD_HEADER, 'windingtree')
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
        .patch('/hotels/dummy')
        .send({ description: desc, ratePlans: ratePlans })
        .expect(401)
        .end(done);
    });

    it('should return 422 when data format is wrong', (done) => {
      const desc = getDescription(),
        ratePlans = getRatePlans();
      delete desc.name;
      request(server)
        .patch('/hotels/dummy')
        .set(ACCESS_KEY_HEADER, accessKey)
        .set(WALLET_PASSWORD_HEADER, 'windingtree')
        .send({
          description: desc,
          ratePlans: ratePlans,
        })
        .expect(422)
        .end(done);
    });

    it('should return 422 when unexpected top-level properties are present', (done) => {
      request(server)
        .patch('/hotels/dummy')
        .set(ACCESS_KEY_HEADER, accessKey)
        .set(WALLET_PASSWORD_HEADER, 'windingtree')
        .send({
          description: getDescription(),
          ratePlans: getRatePlans(),
          religion: 'pagan',
        })
        .expect(422)
        .end(done);
    });

    it('should return 400 when no data is sent', (done) => {
      request(server)
        .patch('/hotels/dummy')
        .set(ACCESS_KEY_HEADER, accessKey)
        .set(WALLET_PASSWORD_HEADER, 'windingtree')
        .send({})
        .expect(400)
        .end(done);
    });
  });

  describe('DELETE /hotels/:address', () => {
    it('should delete the hotel from the on-chain storage', (done) => {
      wtMock.remove.resetHistory();
      offChainUploader.remove.resetHistory();
      request(server)
        .delete('/hotels/0xdummy')
        .set(ACCESS_KEY_HEADER, accessKey)
        .set(WALLET_PASSWORD_HEADER, 'windingtree')
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
        .delete('/hotels/0xdummy?offChain=1')
        .set(ACCESS_KEY_HEADER, accessKey)
        .set(WALLET_PASSWORD_HEADER, 'windingtree')
        .expect(204)
        .end((err, res) => {
          if (err) return done(err);
          try {
            assert.ok(wtMock.remove.calledOnce);
            assert.equal(wtMock.remove.args[0][1], '0xdummy');
            assert.equal(offChainUploader.remove.callCount, 4);
            assert.ok(offChainUploader.remove.calledWith('dummy://dataIndex.json'));
            assert.ok(offChainUploader.remove.calledWith('dummy://description.json'));
            assert.ok(offChainUploader.remove.calledWith('dummy://ratePlans.json'));
            assert.ok(offChainUploader.remove.calledWith('dummy://availability.json'));
            done();
          } catch (e) {
            done(e);
          }
        });
    });

    it('should return HTTP 400 if the offChain parameter is ambiguous', (done) => {
      request(server)
        .delete('/hotels/0xdummy?offChain=maybe')
        .set(ACCESS_KEY_HEADER, accessKey)
        .set(WALLET_PASSWORD_HEADER, 'windingtree')
        .expect(400)
        .end(done);
    });

    it('should return HTTP 401 if authorization headers are missing', (done) => {
      request(server)
        .delete('/hotels/0xdummy?offChain=maybe')
        .expect(401)
        .end(done);
    });
  });

  describe('GET /hotels/:address', (done) => {
    it('should return hotel data', (done) => {
      request(server)
        .get('/hotels/0xdummy')
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
        .get('/hotels/0xdummy?fields=description,ratePlans')
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
        .get('/hotels/0xdummy?fields=affiliation')
        .expect(422)
        .end(done);
    });

    it('should return 502 if the upstream data are not valid', (done) => {
      request(server)
        .get('/hotels/0xinvalid')
        .expect(502)
        .end(done);
    });
  });
});
