/** Return a valid hotel description. */
module.exports.getDescription = function () {
  return {
    name: 'Broken Bones',
    description: 'Stiff drinks and nutritional meals.',
    contacts: {
      general: {
        email: 'broken.bones@example.com',
      },
    },
    address: {
      line1: 'Silent Alley 17',
      city: 'Backwoods',
      country: 'GB',
    },
    timezone: 'Europe/London',
    currency: 'GBP',
    updatedAt: (new Date()).toISOString(),
  };
};

/** Return a valid rate plans representation. */
module.exports.getRatePlans = function () {
  return {
    basic: {
      id: 'id-basic',
      name: 'Basic',
      description: 'One bed, one pillow, no breakfast.',
      updatedAt: (new Date()).toISOString(),
    },
  };
};

/** Return a valid availability representation. */
module.exports.getAvailability = function () {
  return {
    latestSnapshot: {
      availability: {
        ourOnlyRoom: [
          {
            day: '2044-04-04',
            quantity: 1,
          },
        ],
      },
      updatedAt: (new Date()).toISOString(),
    },
    updates: [],
  };
};
