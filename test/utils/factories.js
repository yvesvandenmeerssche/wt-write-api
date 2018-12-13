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
    roomTypes: [
        { id: 'rt-1', name: 'Single', description: 'Small bed', occupancy: { max: 1 }, totalQuantity: 2, updatedAt: '2018-12-12T12:00:00Z' },
    ],
    timezone: 'Europe/London',
    currency: 'GBP',
    updatedAt: (new Date()).toISOString(),
    defaultCancellationAmount: 30,
  };
};

/** Return a valid rate plans representation. */
module.exports.getRatePlans = function () {
  return [
    {
      id: 'basic',
      name: 'Basic',
      description: 'One bed, one pillow, no breakfast.',
      price: 123,
      updatedAt: (new Date()).toISOString(),
      roomTypeIds: ['dummy'],
    },
  ];
};

/** Return a valid availability representation. */
module.exports.getAvailability = function () {
  return {
    roomTypes: [
      {
        roomTypeId: 'ourOnlyRoom',
        date: '2044-04-04',
        quantity: 1,
      },
    ],
    updatedAt: (new Date()).toISOString(),
  };
};

/** Return a valid uploaders representation. */
module.exports.getUploaders = function () {
  return {
    root: { inMemory: {} },
    availability: {
      s3: {
        accessKeyId: 'dummyKeyId',
        secretAccessKey: 'dummyAccessKey',
        region: 'eu-central-1',
        bucket: 'bucket',
        keyPrefix: 'prefix',
      },
    },
    ratePlans: {
      swarm: {
        providerUrl: 'https://swarm-gateways.net',
        timeout: 3000,
        timeoutRead: 5000,
        timeoutWrite: 7000,
      },
    },
  };
};

// Password for this wallet is 'windingtree'.
module.exports.getWallet = function () {
  return {
    // Address is actually forbidden in wallet v3
    // 'address': 'd037ab9025d43f60a31b32a82e10936f07484246',
    'crypto': {
      'cipher': 'aes-128-ctr',
      'cipherparams': {
        'iv': '31b12ef1d308ea1edacc4ab00de80d55',
      },
      'ciphertext': 'ef9dcce915eeb0c4f7aa2bb16b9ae6ce5a4444b4ed8be45d94e6b7fe7f4f9b47',
      'kdf': 'scrypt',
      'kdfparams': {
        'dklen': 32,
        'n': 8192,
        'p': 1,
        'r': 8,
        'salt': 'd06ccd5d9c5d75e1a66a81d2076628f5716a3161ca204d92d04a42c057562541',
      },
      'mac': '2c30bc373c19c5b41385b85ffde14b9ea9f0f609c7812a10fdcb0a565034d9db',
    },
    'id': '7fe84016-4686-4622-97c9-dc7b47f5f5c6',
    'version': 3,
  };
};
