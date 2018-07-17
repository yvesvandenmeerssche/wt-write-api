/* eslint-env mocha */
/* eslint-disable promise/no-promise-in-callback,promise/no-callback-in-promise,promise/no-nesting */
const { assert } = require('chai');
const request = require('supertest');

const { getWallet, getUploaders } = require('../utils/fixtures');
const Profile = require('../../src/models/profile');

describe('controllers - profiles', function () {
  let server;

  before(() => {
    server = require('../../src/index');
  });

  after(() => {
    server.close();
  });

  describe('POST /profile', () => {
    it('should save the profile and return its secret key', (done) => {
      request(server)
        .post('/profile')
        .send({
          wallet: getWallet(),
          uploaders: getUploaders(),
        })
        .expect(201)
        .expect('content-type', /application\/json/)
        .end((err, res) => {
          if (err) return done(err);
          try {
            assert.ok(res.body.accessKey);
            assert.ok((typeof res.body.accessKey) === 'string');
          } catch (e) {
            done(e);
          }
          Profile.get(res.body.accessKey).then((profile) => {
            assert.ok(profile);
            assert.deepEqual(profile, {
              wallet: getWallet(),
              uploaders: getUploaders(),
              accessKey: res.body.accessKey,
            });
            done();
          }).catch((e) => {
            done(e);
          });
        });
    });

    it('should return 422 if the data is invalid', (done) => {
      request(server)
        .post('/profile')
        .send({
          wallet: { dummy: 'dummy' },
          uploaders: getUploaders(),
        })
        .expect(422)
        .end(done);
    });

    it('should return 422 if a required attribute is missing', (done) => {
      request(server)
        .post('/profile')
        .send({
          uploaders: getUploaders(),
        })
        .expect(422)
        .end(done);
    });

    it('should return 422 if an unknown attribute is present', (done) => {
      request(server)
        .post('/profile')
        .send({
          wallet: getWallet(),
          uploaders: getUploaders(),
          hobbies: ['gardening', 'fashion'],
        })
        .expect(422)
        .end(done);
    });
  });

  describe('PUT /profile', () => {
    let accessKey;

    before(async () => {
      accessKey = await Profile.create({
        wallet: getWallet(),
        uploaders: getUploaders(),
      });
    });

    it('should overwrite profile with the given data', (done) => {
      let uploaders = { root: { dummy: {} } };
      request(server)
        .put('/profile')
        .set('X-Access-Key', accessKey)
        .set('X-Wallet-Password', 'windingtree')
        .send({
          wallet: getWallet(),
          uploaders: uploaders,
        })
        .expect(204)
        .end((err, res) => {
          if (err) return done(err);
          Profile.get(accessKey).then((profile) => {
            assert.deepEqual(profile, {
              wallet: getWallet(),
              uploaders: uploaders,
              accessKey: accessKey,
            });
            done();
          }).catch((e) => {
            done(e);
          });
        });
    });

    it('should return 422 if the data is invalid', (done) => {
      request(server)
        .put('/profile')
        .set('X-Access-Key', accessKey)
        .set('X-Wallet-Password', 'windingtree')
        .send({
          wallet: { dummy: 'dummy' },
          uploaders: getUploaders(),
        })
        .expect(422)
        .end(done);
    });

    it('should return 422 if a required attribute is missing', (done) => {
      request(server)
        .put('/profile')
        .set('X-Access-Key', accessKey)
        .set('X-Wallet-Password', 'windingtree')
        .send({
          uploaders: getUploaders(),
        })
        .expect(422)
        .end(done);
    });

    it('should return 422 if an unknown attribute is present', (done) => {
      request(server)
        .put('/profile')
        .set('X-Access-Key', accessKey)
        .set('X-Wallet-Password', 'windingtree')
        .send({
          wallet: getWallet(),
          uploaders: getUploaders(),
          hobbies: ['gardening', 'fashion'],
        })
        .expect(422)
        .end(done);
    });
  });

  describe('DELETE /profile', () => {
    it('should delete the given profile', (done) => {
      Profile.create({
        wallet: getWallet(),
        uploaders: getUploaders(),
      }).then((accessKey) => {
        request(server)
          .delete('/profile')
          .set('X-Access-Key', accessKey)
          .set('X-Wallet-Password', 'windingtree')
          .expect(204)
          .end((err, res) => {
            if (err) return done(err);
            Profile.get(accessKey).then((profile) => {
              assert.isNotOk(profile);
              done();
            }).catch(done);
          });
      }).catch(done);
    });
  });
});
