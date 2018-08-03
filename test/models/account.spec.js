/* eslint-env mocha */
const { assert } = require('chai');

const Account = require('../../src/models/account');
const { ValidationError } = require('../../src/services/validators');
const { getWallet, getUploaders } = require('../utils/factories');

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
      assert.isAtLeast(created.accessKey.length, 32); // Should be secure enough.
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

  describe('getByKey', () => {
    it('should get a previously created account', async () => {
      const { id, accessKey } = await Account.create({
        wallet: getWallet(),
        uploaders: getUploaders(),
      });
      const account = await Account.getByKey(accessKey);
      assert.deepEqual(account, {
        id,
        wallet: getWallet(),
        uploaders: getUploaders(),
      });
    });

    it('should return undefined if no such account exists', async () => {
      const account = await Account.getByKey('nonexistent');
      assert.equal(account, undefined);
    });
  });

  describe('delete', () => {
    it('should delete the given account', async () => {
      const { id: id1, accessKey: accessKey1 } = await Account.create({
        wallet: getWallet(),
        uploaders: getUploaders(),
      });
      const { accessKey: accessKey2 } = await Account.create({
        wallet: getWallet(),
        uploaders: getUploaders(),
      });
      await Account.delete(id1);
      assert.isNotOk(await Account.getByKey(accessKey1));
      assert.isOk(await Account.getByKey(accessKey2));
    });
  });

  describe('update', () => {
    it('should update the given account', async () => {
      const uploaders = getUploaders();
      const { id, accessKey } = await Account.create({
        wallet: getWallet(),
        uploaders: uploaders,
      });
      delete uploaders.availability;
      Account.update(id, {
        wallet: getWallet(),
        uploaders: uploaders,
      });
      const account = await Account.getByKey(accessKey);
      assert.deepEqual(account.uploaders, uploaders);
      assert.deepEqual(account.wallet, getWallet());
    });

    it('should raise a ValidationError when data is not valid', async () => {
      const uploaders = getUploaders();
      const { id } = await Account.create({
        wallet: getWallet(),
        uploaders: uploaders,
      });
      delete uploaders.root;
      try {
        await Account.update(id, {
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
