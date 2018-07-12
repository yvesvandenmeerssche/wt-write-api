const { assert } = require('chai');

const { getDescription, getRatePlans,
  getAvailability } = require('../utils/fixtures');
const { WTDownloader } = require('../../src/services/downloaders');

const description = getDescription();
const ratePlans = getRatePlans();
const availability = getAvailability();

const wtLibsMock = {
  getWTIndex: () => Promise.resolve({
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
  }),
};

describe('downloaders', () => {
  describe('WTDownloader', () => {
    const wtDownloader = new WTDownloader(wtLibsMock, '0xdummyindex');

    describe('getDataIndex()', () => {
      it('should retrieve the data index via wtLibs', async () => {
        const dataIndex = await wtDownloader.getDataIndex('0xdummyhotel');
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
        const data = await wtDownloader.getDocuments('0xdummyhotel', ['description', 'ratePlans', 'availability']);
        assert.deepEqual(data, {
          description,
          ratePlans,
          availability,
        });
      });

      it('should limit the retrieved data based on the given fieldNames', async () => {
        const data = await wtDownloader.getDocuments('0xdummyhotel', ['ratePlans']);
        assert.deepEqual(data, {
          ratePlans,
        });
      });
    });
  });
});
