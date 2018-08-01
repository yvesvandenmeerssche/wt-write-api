const { assert } = require('chai');

const { getDescription, getRatePlans, getAvailability,
  getUploaders, getWallet } = require('../../utils/factories');

const { validateDescription, validateRatePlans, validateAvailability,
  validateUploaders, validateWallet, ValidationError } = require('../../../src/services/validators');

describe('validators', function () {
  describe('validateDescription', () => {
    it('should pass when the data is correct', () => {
      validateDescription(getDescription());
    });

    it('should fail when a required attribute is missing', () => {
      let desc = getDescription();
      delete desc.name;
      assert.throws(() => validateDescription(desc), ValidationError,
        /Missing required property: name/);
    });

    it('should fail when an unknown attribute is provided', () => {
      let desc = getDescription();
      desc.period = 'Middle Ages';
      assert.throws(() => validateDescription(desc), ValidationError,
        /Unknown property/);
    });

    it('should fail when the time format is wrong', () => {
      let desc = getDescription();
      desc.updatedAt = 'hola';
      assert.throws(() => validateDescription(desc), ValidationError, /ISO 8601/);
    });

    it('should fail when the country code is invalid', () => {
      let desc = getDescription();
      desc.address.country = 'XX';
      assert.throws(() => validateDescription(desc), ValidationError, /ISO 3166-1/);
    });

    it('should fail when the timezone is invalid', () => {
      let desc = getDescription();
      desc.timezone = 'Europe/Friesland';
      assert.throws(() => validateDescription(desc), ValidationError, /timezone/);
    });

    it('should fail when the currency code is invalid', () => {
      let desc = getDescription();
      desc.currency = 'OMG';
      assert.throws(() => validateDescription(desc), ValidationError, /ISO 4217/);
    });
  });

  describe('validateRatePlans', () => {
    it('should pass when the data is correct', () => {
      validateRatePlans(getRatePlans());
    });

    it('should fail when a required attribute is missing', () => {
      let plans = getRatePlans();
      delete plans.basic.name;
      assert.throws(() => validateRatePlans(plans), ValidationError,
        /Missing required property: name/);
    });

    it('should fail when an unknown attribute is provided', () => {
      let plans = getRatePlans();
      plans.basic.colour = 'green';
      assert.throws(() => validateRatePlans(plans), ValidationError,
        /Unknown property/);
    });

    it('should fail when the currency code is invalid', () => {
      let plans = getRatePlans();
      plans.basic.currency = 'OMG';
      assert.throws(() => validateRatePlans(plans), ValidationError, /ISO 4217/);
    });
  });

  describe('validateAvailability', () => {
    it('should pass when the data is correct', () => {
      validateAvailability(getAvailability());
    });

    it('should fail when a required attribute is missing', () => {
      let availability = getAvailability();
      delete availability.latestSnapshot.availability.ourOnlyRoom[0].day;
      assert.throws(() => validateAvailability(availability), ValidationError,
        /Missing required property: day/);
    });

    it('should fail when an unknown attribute is provided', () => {
      let availability = getAvailability();
      availability.certainty = 'maybe';
      assert.throws(() => validateAvailability(availability), ValidationError,
        /Unknown property/);
    });
  });

  describe('validateUploaders', () => {
    it('should pass when the data is correct', () => {
      validateUploaders(getUploaders());
    });

    it('should fail when the root attribute is missing', () => {
      let uploaders = getUploaders();
      delete uploaders.root;
      assert.throws(() => validateUploaders(uploaders), ValidationError,
        /Missing required property: root/);
    });

    it('should fail when the s3 uploader is misconfigured', () => {
      let uploaders = getUploaders();
      delete uploaders.availability.s3.accessKeyId;
      assert.throws(() => validateUploaders(uploaders), ValidationError,
        /Invalid uploader configuration/);
    });
  });

  describe('validateWallet', () => {
    it('should pass when the data is correct', () => {
      validateWallet(getWallet());
    });

    it('should fail when the data is an invalid object', () => {
      let wallet = { dummy: 'dummy' };
      assert.throws(() => validateWallet(wallet), ValidationError);
    });

    it('should fail when the data is not an object', () => {
      let wallet = 'dummy';
      assert.throws(() => validateWallet(wallet), ValidationError);
    });
  });
});
