const { assert } = require('chai');
const request = require('supertest');
const sinon = require('sinon');

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
  });
});
