/**
 * Specific combination of uploaders to be used.
 */
class UploaderConfig {
  /**
   * @param {OnChainUploader} onChainUploader
   * @param {Object} offChainUploaders Mapping of dot-separated
   *                 field paths to OffChainUploader instances.
   */
  constructor (onChainUploader, offChainUploaders) {
    if (!offChainUploaders || !offChainUploaders.root) {
      throw new Error('No default (`root`) offchain uploader specified!');
    }
    this.onChain = onChainUploader;
    this.offChain = offChainUploaders;
  }

  /**
   * Get off-chain uploader for the specified data subtree.
   */
  getUploader (subtree) {
    return this.offChain[subtree] || this.offChain.root;
  }
};

module.exports = {
  UploaderConfig: UploaderConfig,
};
