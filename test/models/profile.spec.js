/* eslint-env mocha */
const { assert } = require('chai');

const Profile = require('../../src/models/profile');
const { ValidationError } = require('../../src/services/validators');
const { getWallet, getUploaders } = require('../utils/fixtures');

describe('models - profile', () => {
  describe('create', () => {
    it('should create a new profile and return its secret key', async () => {
      const accessKey = await Profile.create({
        wallet: getWallet(),
        uploaders: getUploaders(),
      });
      assert.ok(typeof accessKey === 'string');
      assert.isAbove(accessKey.length, 32);
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
});
