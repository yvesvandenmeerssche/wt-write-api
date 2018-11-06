const { assert } = require('chai');

const { getDescription, getRatePlans,
  getAvailability } = require('../utils/factories');
const { WT } = require('../../src/services/wt');
const { DATA_FORMAT_VERSION } = require('../../src/constants');

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
            get contents () {
              return Promise.resolve({
                descriptionUri: {
                  ref: 'dummy://description.json',
                  toPlainObject: () => Promise.resolve({
                    ref: 'dummy://description.json',
                    contents: description,
                  }),
                },
                ratePlansUri: {
                  ref: 'dummy://ratePlans.json',
                  toPlainObject: () => Promise.resolve({
                    ref: 'dummy://ratePlans.json',
                    contents: ratePlans,
                  }),
                },
                availabilityUri: {
                  ref: 'dummy://availability.json',
                  toPlainObject: () => Promise.resolve({
                    ref: 'dummy://availability.json',
                    contents: availability,
                  }),
                },
                notificationsUri: 'http://notifications.example',
                bookingUri: 'http://booking.example',
                dataFormatVersion: DATA_FORMAT_VERSION,
              });
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
          notificationsUri: 'http://notifications.example',
          bookingUri: 'http://booking.example',
          dataFormatVersion: DATA_FORMAT_VERSION,
        },
      });
    });
  });

  describe('getDocuments()', () => {
    it('should retrieve data subtrees via wtLibs', async () => {
      const data = await wt.getDocuments('0xdummyhotel', ['description', 'ratePlans', 'availability', 'notifications', 'booking']);
      assert.deepEqual(data, {
        description,
        ratePlans,
        availability,
        notifications: 'http://notifications.example',
        booking: 'http://booking.example',
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
