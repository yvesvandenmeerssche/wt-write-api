/**
 * Base class for all on-chain uploaders.
 */
class OnChainUploader {
  constructor (wallet) {
    this.wallet = wallet;
  }

  /**
   * Create a hotel with the given dataIndexUri.
   *
   * @param {Object} data Hotel data to be uploaded.
   * @return {Promise<string>} Etherum address of the uploaded
   * data.
   */
  upload (dataIndexUri) {
    return Promise.reject(new Error('Not implemented'));
  }

  /**
   * Remove the hotel from WT index.
   *
   * @param {Object} data Hotel data to be uploaded.
   * @return {Promise<void>} Etherum address of the uploaded
   * data.
   */
  remove () {
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

  remove () {
    return Promise.resolve();
  }
};

module.exports = {
  OnChainUploader: OnChainUploader,
  DummyUploader: DummyUploader,
};
