const { assert } = require('chai');

const { validateDescription, validateRatePlans,
  validateAvailability } = require('../src/validators');

/** Return a valid hotel description. */
function _getHotelDescription () {
  return {
    name: 'Broken Bones',
    description: 'Stiff drinks and nutritional meals.',
    contacts: {
      general: {
        email: 'broken.bones@example.com',
      }
    },
    address: {
      line1: 'Silent Alley 17',
      city: 'Backwoods',
      country: 'UK',
    },
    timezone: 'Europe/London',
    currency: 'GBP'
  };
}

/** Return a valid rate plans representation. */
function _getRatePlans () {
  return {
    basic: {
      id: 'id-basic',
      name: 'Basic',
      description: 'One bed, one pillow, no breakfast.',
    },
  };
}

/** Return a valid availability representation. */
function _getAvailability () {
  return {
    latestSnapshot: {
      availability: {
        ourOnlyRoom: [
          {
            day: '2044-04-04',
            quantity: 1,
          }
        ],
      },
    },
    updates: [],
  };
}

describe('validators', function () {
  describe('validateDescription', () => {
    it('should pass when the data is correct', () => {
      validateDescription(_getHotelDescription());
    });

    it('should fail when a required attribute is missing', () => {
      let desc = _getHotelDescription();
      delete desc.name;
      assert.throws(() => validateDescription(desc), /Missing required property: name/);
    });

    it('should fail when an unknown attribute is provided', () => {
      let desc = _getHotelDescription();
      desc.period = 'Middle Ages';
      assert.throws(() => validateDescription(desc), /Unknown property/);
    });
  });

  describe('validateRatePlans', () => {
    it('should pass when the data is correct', () => {
      validateRatePlans(_getRatePlans());
    });

    it('should fail when a required attribute is missing', () => {
      let plans = _getRatePlans();
      delete plans.basic.name;
      assert.throws(() => validateRatePlans(plans), /Missing required property: name/);
    });

    it('should fail when an unknown attribute is provided', () => {
      let plans = _getRatePlans();
      plans.basic.colour = 'green';
      assert.throws(() => validateRatePlans(plans), /Unknown property/);
    });
  });

  describe('validateAvailability', () => {
    it('should pass when the data is correct', () => {
      validateAvailability(_getAvailability());
    });

    it('should fail when a required attribute is missing', () => {
      let availability = _getAvailability();
      delete availability.latestSnapshot.availability.ourOnlyRoom[0].day;
      assert.throws(() => validateAvailability(availability), /Missing required property: day/);
    });

    it('should fail when an unknown attribute is provided', () => {
      let availability = _getAvailability();
      availability.certainty = 'maybe';
      assert.throws(() => validateAvailability(availability), /Unknown property/);
    });
  });
});
