/* eslint-env mocha */

const { assert } = require('chai');
const sinon = require('sinon');

const { attachProfile } = require('../src/middleware');
const WT = require('../src/services/wt');
let origWT;

describe('middleware', () => {
  const walletMock = {
    lock: sinon.spy(),
    unlock: sinon.spy(),
  };

  before(() => {
    try {
      origWT = WT.get();
    } catch (e) {}
    WT.set({
      createWallet: () => Promise.resolve(walletMock),
    });
  });

  after(() => {
    if (origWT) {
      WT.set(origWT);
    }
  });

  describe('attachProfile', () => {
    it('should attach all expected attributes to the request', () => {
      const req = {};
      attachProfile(req, undefined, () => undefined);
      assert.isDefined(req.profile);
      assert.isDefined(req.profile.uploaders);
      assert.isDefined(req.profile.withWallet);
    });

    it('should expose a usable withWallet profile function', async () => {
      const req = {};
      attachProfile(req, undefined, () => undefined);
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
    });
  });
});
