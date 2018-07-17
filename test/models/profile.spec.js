/* eslint-env mocha */
const { assert } = require('chai');

const Profile = require('../../src/models/profile');
const { ValidationError } = require('../../src/services/validators');
const { getWallet, getUploaders } = require('../utils/fixtures');

describe('models - profile', () => {
  describe('create', () => {
    it('should create a new profile and return its access key', async () => {
      const accessKey = await Profile.create({
        wallet: getWallet(),
        uploaders: getUploaders(),
      });
      assert.ok(typeof accessKey === 'string');
      assert.isAbove(accessKey.length, 32); // Should be secure enough.
      assert.isBelow(accessKey.length, 255); // Should fit to the DB.
    });

    it('should raise a ValidationError when data is not valid', async () => {
      let uploaders = getUploaders();
      delete uploaders.root;
      try {
        await Profile.create({
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
    it('should get a previously created profile', async () => {
      const accessKey = await Profile.create({
        wallet: getWallet(),
        uploaders: getUploaders(),
      });
      const profile = await Profile.get(accessKey);
      assert.deepEqual(profile, {
        wallet: getWallet(),
        uploaders: getUploaders(),
        accessKey: accessKey,
      });
    });

    it('should return undefined if no such profile exists', async () => {
      const profile = await Profile.get('nonexistent');
      assert.equal(profile, undefined);
    });
  });

  describe('delete', () => {
    it('should delete the given profile', async () => {
      const accessKey1 = await Profile.create({
        wallet: getWallet(),
        uploaders: getUploaders(),
      });
      const accessKey2 = await Profile.create({
        wallet: getWallet(),
        uploaders: getUploaders(),
      });
      await Profile.delete(accessKey1);
      assert.isNotOk(await Profile.get(accessKey1));
      assert.isOk(await Profile.get(accessKey2));
    });
  });

  describe('update', () => {
    it('should update the given profile', async () => {
      const uploaders = getUploaders();
      const accessKey = await Profile.create({
        wallet: getWallet(),
        uploaders: uploaders,
      });
      delete uploaders.availability;
      Profile.update(accessKey, {
        wallet: getWallet(),
        uploaders: uploaders,
      });
      const profile = await Profile.get(accessKey);
      assert.deepEqual(profile.uploaders, uploaders);
      assert.deepEqual(profile.wallet, getWallet());
    });

    it('should raise a ValidationError when data is not valid', async () => {
      const uploaders = getUploaders();
      const accessKey = await Profile.create({
        wallet: getWallet(),
        uploaders: uploaders,
      });
      delete uploaders.root;
      try {
        await Profile.update(accessKey, {
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
