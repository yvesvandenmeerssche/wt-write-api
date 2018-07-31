const InMemoryAdapter = require('@windingtree/off-chain-adapter-in-memory');

const { OffChainUploader } = require('./base');

/**
 * Uploader for in memory storage.
 */
class InMemoryUploader extends OffChainUploader {
  constructor (options) {
    super();
    this._inMemoryAdapter = new InMemoryAdapter();
  }

  async upload (data, label, preferredUrl) {
    await super.upload(data, label, preferredUrl);
    return this._inMemoryAdapter.upload(data);
  }
};

module.exports = {
  InMemoryUploader,
};
