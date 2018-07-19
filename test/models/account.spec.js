/* eslint-env mocha */
const { assert } = require('chai');

const Account = require('../../src/models/account');
const { ValidationError } = require('../../src/services/validators');
const { getWallet, getUploaders } = require('../utils/fixtures');

describe('models - account', () => {
  describe('create', () => {
    it('should create a new account and return its ID and access key', async () => {
      const created = await Account.create({
        wallet: getWallet(),
        uploaders: getUploaders(),
      });
      assert.property(created, 'id');
      assert.property(created, 'accessKey');
      assert.ok(typeof created.id === 'string');
      assert.ok(typeof created.accessKey === 'string');
      assert.isAbove(created.accessKey.length, 32); // Should be secure enough.
      assert.isBelow(created.accessKey.length, 255); // Should fit to the DB.
    });

    it('should raise a ValidationError when data is not valid', async () => {
      let uploaders = getUploaders();
      delete uploaders.root;
      try {
        await Account.create({
          wallet: getWallet(),
          uploaders: uploaders,
        });
        throw new Error('Should have raised an error');
      } catch (err) {
        assert.instanceOf(err, ValidationError);
      }
    });
  });

  describe('get', () => {
    it('should get a previously created account', async () => {
      const { id, accessKey } = await Account.create({
        wallet: getWallet(),
        uploaders: getUploaders(),
      });
      const account = await Account.get(accessKey);
      assert.deepEqual(account, {
        id,
        wallet: getWallet(),
        uploaders: getUploaders(),
        accessKey,
      });
    });

    it('should return undefined if no such account exists', async () => {
      const account = await Account.get('nonexistent');
      assert.equal(account, undefined);
    });
  });

  describe('delete', () => {
    it('should delete the given account', async () => {
      const { accessKey: accessKey1 } = await Account.create({
        wallet: getWallet(),
        uploaders: getUploaders(),
      });
      const { accessKey: accessKey2 } = await Account.create({
        wallet: getWallet(),
        uploaders: getUploaders(),
      });
      await Account.delete(accessKey1);
      assert.isNotOk(await Account.get(accessKey1));
      assert.isOk(await Account.get(accessKey2));
    });
  });

  describe('update', () => {
    it('should update the given account', async () => {
      const uploaders = getUploaders();
      const { accessKey } = await Account.create({
        wallet: getWallet(),
        uploaders: uploaders,
      });
      delete uploaders.availability;
      Account.update(accessKey, {
        wallet: getWallet(),
        uploaders: uploaders,
      });
      const account = await Account.get(accessKey);
      assert.deepEqual(account.uploaders, uploaders);
      assert.deepEqual(account.wallet, getWallet());
    });

    it('should raise a ValidationError when data is not valid', async () => {
      const uploaders = getUploaders();
      const { accessKey } = await Account.create({
        wallet: getWallet(),
        uploaders: uploaders,
      });
      delete uploaders.root;
      try {
        await Account.update(accessKey, {
          wallet: getWallet(),
          uploaders: uploaders,
        });
        throw new Error('Should have raised an error');
      } catch (err) {
        assert.instanceOf(err, ValidationError);
      }
    });
  });
});
