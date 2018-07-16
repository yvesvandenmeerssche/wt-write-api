/* eslint-env mocha */
const { assert } = require('chai');

const { resetDB } = require('../../src/db');
const Profile = require('../../src/models/profile');

describe('models - profile', () => {
  before(async () => {
    await resetDB();
  });

  describe('create', () => {
    it('should create a new profile and return its secret key', async () => {
      const secretKey = await Profile.create({
        wallet: { dummy: 'dummy' },
        uploaderConfig: { dummy: 'dummy' },
      });
      assert.ok(typeof secretKey === 'string');
      assert.isAbove(secretKey.length, 32);
    });
  });

  describe('get', () => {
    it('should get a previously created profile', async () => {
      const secretKey = await Profile.create({
        wallet: { dummy: 'dummy' },
        uploaderConfig: { dummy: 'dummy' },
      });
      const profile = await Profile.get(secretKey);
      assert.deepEqual(profile, {
        wallet: { dummy: 'dummy' },
        uploaderConfig: { dummy: 'dummy' },
        secretKey: secretKey,
      });
    });

    it('should return undefined if no such profile exists', async () => {
      const profile = await Profile.get('nonexistent');
      assert.equal(profile, undefined);
    });
  });
});
