/**
 * Base class for all off-chain uploaders.
 */
class OffChainUploader {
  /**
   * @param {Object} data Hotel data to be uploaded.
   * @return {Promise<string>} URL of the uploaded data.
   */
  upload (data) {
    return Promise.reject(new Error('Not implemented'));
  }
};

/**
 * A dummy implementation of on-chain uploader that doesn't
 * actually do anything - useful for testing.
 */
class DummyUploader extends OffChainUploader {
  upload (data) {
    return Promise.resolve('dummy://dummy');
  }
};

module.exports = {
  OffChainUploader: OffChainUploader,
  DummyUploader: DummyUploader,
};
