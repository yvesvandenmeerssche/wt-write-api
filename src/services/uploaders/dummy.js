const { OffChainUploader } = require('./base');

/**
 * A dummy implementation of off-chain uploader that doesn't
 * actually do anything - useful for testing.
 */
class DummyUploader extends OffChainUploader {
  async upload (data, label, preferredUrl) {
    await super.upload(data, label, preferredUrl);
    return `dummy://${label}.json`;
  }
};

module.exports = {
  DummyUploader,
};
