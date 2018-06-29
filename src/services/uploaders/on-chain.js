/**
 * Base class for all on-chain uploaders.
 */
class OnChainUploader {
  /**
   * @param {Object} data Hotel data to be uploaded.
   * @return {Promise<string>} Etherum address of the uploaded
   * data.
   */
  upload (dataIndexUri) {
    return Promise.reject(new Error('Not implemented'));
  }
};

/**
 * A dummy implementation of on-chain uploader that doesn't
 * actually do anything - useful for testing.
 */
class DummyUploader extends OnChainUploader {
  upload (dataIndexUri) {
    return Promise.resolve('dummyAddress');
  }
};

module.exports = {
  OnChainUploader: OnChainUploader,
  DummyUploader: DummyUploader,
};
