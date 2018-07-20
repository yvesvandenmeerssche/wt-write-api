/**
 * Base class for all off-chain uploaders.
 */
class OffChainUploader {
  /**
   * Upload data to an off-chain storage.
   *
   * @param {Object} data Hotel data to be uploaded.
   * @param {string} label To make generated URLs more
   *   human-friendly, if possible.
   * @param {string} preferredUrl Upload to the given URL, if
   *   possible. (If not possible, upload to an arbitrary URL
   *   instead.) Serves to avoid the need of updating
   *   blockchain.
   * @return {Promise<string>} URL of the uploaded data.
   */
  async upload (data, label, preferredUrl) {
    if (!data) {
      throw new Error('Please provide the data to be uploaded.');
    }
    if (!label) {
      throw new Error('Please provide a label for the data.');
    }
    // NOTE: implement the rest in the subclasses.
  }

  /**
   * Remove data from an off-chain storage, if possible.
   *
   * @param {string} url Remove document from the given URL, if possible.
   * @return {Promise<Boolean>} A Promise of the deletion result
   *    - true if deletion was possible, false otherwise.
   */
  async remove (url) {
    return false;
  }
};

module.exports = {
  OffChainUploader,
};
