const InMemoryAdapter = require('@windingtree/off-chain-adapter-in-memory');

const { HttpBadGatewayError } = require('../../errors');
const { OffChainUploader } = require('./base');

/**
 * Uploader for in memory JSON storage.
 */
class InMemoryUploader extends OffChainUploader {
  constructor (options) {
    super();
    this._inMemoryAdapter = new InMemoryAdapter();
  }

  async upload (data, label, preferredUrl) {
    await super.upload(data, label, preferredUrl);
    try {
      return (await this._inMemoryAdapter.upload(data));
    } catch (err) {
      if (err.message && err.message.match(/Error \d\d\d\./)) {
        throw new HttpBadGatewayError('badGatewayError', err.message);
      }
      throw err;
    }
  }
};

module.exports = {
  InMemoryUploader,
};
