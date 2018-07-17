/* eslint-env mocha */
/* eslint-disable promise/no-promise-in-callback */

const { assert } = require('chai');
const sinon = require('sinon');
const WTLibs = require('@windingtree/wt-js-libs');

const { HttpUnauthorizedError } = require('../src/errors');
const { attachProfile } = require('../src/middleware');
const Profile = require('../src/models/profile');
const WT = require('../src/services/wt');
const { getWallet } = require('./utils/fixtures');
const { ACCESS_KEY_HEADER, WALLET_PASSWORD_HEADER } = require('../src/constants');
let origWT;

describe('middleware', () => {
  const walletMock = {
    lock: sinon.spy(),
    unlock: sinon.stub().callsFake((pwd) => {
      if (pwd !== 'windingtree') {
        throw new WTLibs.errors.WalletPasswordError();
      }
    }),
  };
  let accessKey;

  before(async () => {
    try {
      origWT = WT.get();
    } catch (e) {}
    WT.set({
      createWallet: () => walletMock,
    });

    accessKey = await Profile.create({
      wallet: getWallet(),
      uploaders: {
        root: {
          dummy: {},
        },
      },
    });
  });

  after(() => {
    if (origWT) {
      WT.set(origWT);
    }
  });

  describe('attachProfile', () => {
    it('should attach all expected attributes to the request', (done) => {
      const req = {
        header: (key) => {
          return {
            [ACCESS_KEY_HEADER]: accessKey,
            [WALLET_PASSWORD_HEADER]: 'windingtree',
          }[key];
        },
      };
      attachProfile(req, undefined, (err) => {
        if (err) return done(err);
        try {
          assert.isDefined(req.profile);
          assert.isDefined(req.profile.uploaders);
          assert.isDefined(req.profile.withWallet);
          assert.isDefined(req.profile.accessKey);
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('should expose a usable withWallet profile function', (done) => {
      const req = {
        header: (key) => {
          return {
            [ACCESS_KEY_HEADER]: accessKey,
            [WALLET_PASSWORD_HEADER]: 'windingtree',
          }[key];
        },
      };
      attachProfile(req, undefined, async (err) => {
        if (err) return done(err);
        try {
          walletMock.lock.resetHistory();
          walletMock.unlock.resetHistory();
          await req.profile.withWallet((wallet) => {
            assert.equal(wallet, walletMock);
          });
          assert.ok(walletMock.unlock.calledOnce);
          assert.ok(walletMock.unlock.args[0][0]); // A password was supplied.
          assert.ok(walletMock.lock.calledOnce); // Wallet has been locked again.

          walletMock.lock.resetHistory();
          walletMock.unlock.resetHistory();
          await req.profile.withWallet((wallet) => {
            throw new Error('Ouch');
          }).then(() => { throw new Error('Should have rejected the promise'); }, () => undefined);
          assert.ok(walletMock.unlock.calledOnce);
          assert.ok(walletMock.lock.calledOnce); // Wallet has been locked even though there was an error.
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('should throw HttpUnauthorizedError when access key is not provided', (done) => {
      const req = {
        header: (key) => {
          return { [WALLET_PASSWORD_HEADER]: 'windingtree' }[key];
        },
      };
      attachProfile(req, undefined, (err) => {
        try {
          assert.instanceOf(err, HttpUnauthorizedError);
          assert.match(err.message, /You need to provide/);
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('should throw HttpUnauthorizedError when access key is not valid', (done) => {
      const req = {
        header: (key) => {
          return {
            [ACCESS_KEY_HEADER]: 'invalid',
            [WALLET_PASSWORD_HEADER]: 'windingtree',
          }[key];
        },
      };
      attachProfile(req, undefined, (err) => {
        try {
          assert.instanceOf(err, HttpUnauthorizedError);
          assert.match(err.message, /Invalid access key/);
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('should throw HttpUnauthorizedError when wallet password is not provided', (done) => {
      const req = {
        header: (key) => {
          return { [ACCESS_KEY_HEADER]: accessKey }[key];
        },
      };
      attachProfile(req, undefined, (err) => {
        try {
          assert.instanceOf(err, HttpUnauthorizedError);
          assert.match(err.message, /You need to provide/);
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('should throw HttpUnauthorizedError when wallet password is not valid', (done) => {
      const req = {
        header: (key) => {
          return {
            [ACCESS_KEY_HEADER]: accessKey,
            [WALLET_PASSWORD_HEADER]: 'invalid',
          }[key];
        },
      };
      attachProfile(req, undefined, async (err) => {
        try {
          if (err) return done(err);
          await req.profile.withWallet(() => undefined).then(() => {
            throw new Error('Should have rejected the promise');
          }, (err) => {
            assert.instanceOf(err, HttpUnauthorizedError);
            assert.match(err.message, /Invalid password/);
          });
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  });
});
