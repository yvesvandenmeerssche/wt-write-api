const { assert } = require('chai');

const { getDescription, getRatePlans,
  getAvailability } = require('../utils/factories');
const { WT } = require('../../src/services/wt');

const description = getDescription();
const ratePlans = getRatePlans();
const availability = getAvailability();

const wtLibsMock = {
  createWallet: () => {
    return {
      lock: () => undefined,
      unlock: () => undefined,
    };
  },
  getWTIndex: () => {
    return {
      getHotel: () => Promise.resolve({
        get dataIndex () {
          return {
            ref: 'dummy://dataIndex.json',
            contents: {
              get descriptionUri () {
                return Promise.resolve({
                  ref: 'dummy://description.json',
                  toPlainObject: () => Promise.resolve({
                    ref: 'dummy://description.json',
                    contents: description,
                  }),
                });
              },
              get ratePlansUri () {
                return Promise.resolve({
                  ref: 'dummy://ratePlans.json',
                  toPlainObject: () => Promise.resolve({
                    ref: 'dummy://ratePlans.json',
                    contents: ratePlans,
                  }),
                });
              },
              get availabilityUri () {
                return Promise.resolve({
                  ref: 'dummy://availability.json',
                  toPlainObject: () => Promise.resolve({
                    ref: 'dummy://availability.json',
                    contents: availability,
                  }),
                });
              },
            },
          };
        },
      }),
    };
  },
};

describe('WT', () => {
  const wt = new WT(wtLibsMock, '0xdummyindex');

  describe('getDataIndex()', () => {
    it('should retrieve the data index via wtLibs', async () => {
      const dataIndex = await wt.getDataIndex('0xdummyhotel');
      assert.deepEqual(dataIndex, {
        ref: 'dummy://dataIndex.json',
        contents: {
          descriptionUri: 'dummy://description.json',
          ratePlansUri: 'dummy://ratePlans.json',
          availabilityUri: 'dummy://availability.json',
        },
      });
    });
  });

  describe('getDocuments()', () => {
    it('should retrieve data subtrees via wtLibs', async () => {
      const data = await wt.getDocuments('0xdummyhotel', ['description', 'ratePlans', 'availability']);
      assert.deepEqual(data, {
        description,
        ratePlans,
        availability,
      });
    });

    it('should limit the retrieved data based on the given fieldNames', async () => {
      const data = await wt.getDocuments('0xdummyhotel', ['ratePlans']);
      assert.deepEqual(data, {
        ratePlans,
      });
    });
  });
});
