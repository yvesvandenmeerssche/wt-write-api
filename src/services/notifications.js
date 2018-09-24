const request = require('xhr-request-promise');

const HOTEL_RESOURCE_TYPE = 'hotel';

let _requestLib = request;

/* Send a publication request to the notification service. */
async function publish (notificationsUri, notification) {
  const separator = notificationsUri.endsWith('/') ? '' : '/';
  await _requestLib(`${notificationsUri}${separator}notifications`, {
    method: 'POST',
    json: true,
    body: notification,
  });
}

function publishForHotel (notificationsUri, wtIndex, hotelAddress, scope) {
  return publish(notificationsUri, {
    wtIndex,
    resourceType: HOTEL_RESOURCE_TYPE,
    resourceAddress: hotelAddress,
    scope: scope,
  });
}

/**
 * Publish notification about hotel creation.
 *
 * @param {String} notificationsUri
 * @param {String} wtIndex
 * @param {String} hotelAddress
 * @return {Promise<void>}
 */
module.exports.publishHotelCreated = function (notificationsUri, wtIndex, hotelAddress) {
  return publishForHotel(notificationsUri, wtIndex, hotelAddress, { action: 'create' });
};

/**
 * Publish notification about hotel deletion.
 *
 * @param {String} notificationsUri
 * @param {String} wtIndex
 * @param {String} hotelAddress
 * @return {Promise<void>}
 */
module.exports.publishHotelDeleted = function (notificationsUri, wtIndex, hotelAddress) {
  return publishForHotel(notificationsUri, wtIndex, hotelAddress, { action: 'delete' });
};

/**
 * Publish notification about hotel update.
 *
 * @param {String} notificationsUri
 * @param {String} wtIndex
 * @param {String} hotelAddress
 * @param {String[]} subjects (optional)
 * @return {Promise<void>}
 */
module.exports.publishHotelUpdated = function (notificationsUri, wtIndex, hotelAddress, subjects) {
  return publishForHotel(notificationsUri, wtIndex, hotelAddress, {
    action: 'update',
    subjects: subjects,
  });
};

/**
 * Allow requestLib to be overwritten from outside for mocking
 * purposes.
 */
module.exports.setRequestLib = function (lib) {
  _requestLib = lib;
};
