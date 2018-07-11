/**
 * Base class for all on-chain uploaders.
 */
class OnChainUploader {
  constructor (wallet) {
    this.wallet = wallet;
  }

  /**
   * Create or update hotel with the given dataIndexUri.
   *
   * @param {string} dataIndexUri
   * @param {string} hotelAddress (optional)
   * @return {Promise<string>} Etherum address of the uploaded
   * data.
   */
  upload (dataIndexUri, hotelAddress) {
    return Promise.reject(new Error('Not implemented'));
  }

  /**
   * Remove the hotel from WT index.
   *
   * @return {Promise<void>}
   */
  remove (address) {
    return Promise.reject(new Error('Not implemented'));
  }
};

/**
 * A dummy implementation of on-chain uploader that doesn't
 * actually do anything - useful for testing.
 */
class DummyUploader extends OnChainUploader {
  upload (dataIndexUri, hotelAddress) {
    return Promise.resolve(hotelAddress || 'dummyAddress');
  }

  remove (address) {
    return Promise.resolve();
  }
};

module.exports = {
  OnChainUploader: OnChainUploader,
  DummyUploader: DummyUploader,
};
