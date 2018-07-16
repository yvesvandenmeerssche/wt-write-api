/* eslint-env mocha */
const { assert } = require('chai');

const Profile = require('../../src/models/profile');

describe('models - profile', () => {
  describe('create', () => {
    it('should create a new profile and return its secret key', async () => {
      const accessKey = await Profile.create({
        wallet: { dummy: 'dummy' },
        uploaders: { dummy: 'dummy' },
      });
      assert.ok(typeof accessKey === 'string');
      assert.isAbove(accessKey.length, 32);
    });
  });

  describe('get', () => {
    it('should get a previously created profile', async () => {
      const accessKey = await Profile.create({
        wallet: { dummy: 'dummy' },
        uploaders: { dummy: 'dummy' },
      });
      const profile = await Profile.get(accessKey);
      assert.deepEqual(profile, {
        wallet: { dummy: 'dummy' },
        uploaders: { dummy: 'dummy' },
        accessKey: accessKey,
      });
    });

    it('should return undefined if no such profile exists', async () => {
      const profile = await Profile.get('nonexistent');
      assert.equal(profile, undefined);
    });
  });
});
