/* eslint-env mocha */
const { assert } = require('chai');
const sinon = require('sinon');

const notifications = require('../../src/services/notifications');

describe('notifications', () => {
  let requestLibMock;

  beforeEach(() => {
    requestLibMock = sinon.stub().returns(Promise.resolve());
    notifications.setRequestLib(requestLibMock);
  });

  describe('publishHotelCreated', () => {
    it('should send the appropriate request to the notification service', async () => {
      await notifications.publishHotelCreated('http://notifications.example', '0xwtIndex', '0xresourceAddress');
      assert.equal(requestLibMock.callCount, 1);
      assert.deepEqual(requestLibMock.args[0], ['http://notifications.example/notifications', {
        method: 'POST',
        json: true,
        body: {
          wtIndex: '0xwtIndex',
          resourceType: 'hotel',
          resourceAddress: '0xresourceAddress',
          scope: {
            action: 'create',
          },
        },
      }]);
    });
  });

  describe('publishHotelUpdated', () => {
    it('should send the appropriate request to the notification service', async () => {
      await notifications.publishHotelUpdated('http://notifications.example', '0xwtIndex', '0xresourceAddress', ['ratePlans']);
      assert.equal(requestLibMock.callCount, 1);
      assert.deepEqual(requestLibMock.args[0], ['http://notifications.example/notifications', {
        method: 'POST',
        json: true,
        body: {
          wtIndex: '0xwtIndex',
          resourceType: 'hotel',
          resourceAddress: '0xresourceAddress',
          scope: {
            action: 'update',
            subjects: ['ratePlans'],
          },
        },
      }]);
    });
  });

  describe('publishHotelDeleted', () => {
    it('should send the appropriate request to the notification service', async () => {
      await notifications.publishHotelDeleted('http://notifications.example/', '0xwtIndex', '0xresourceAddress');
      assert.equal(requestLibMock.callCount, 1);
      assert.deepEqual(requestLibMock.args[0], ['http://notifications.example/notifications', {
        method: 'POST',
        json: true,
        body: {
          wtIndex: '0xwtIndex',
          resourceType: 'hotel',
          resourceAddress: '0xresourceAddress',
          scope: {
            action: 'delete',
          },
        },
      }]);
    });
  });
});
