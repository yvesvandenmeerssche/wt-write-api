const { SwarmUploader } = require('./swarm');
const { InMemoryUploader } = require('./in-memory');
const { S3Uploader } = require('./s3');
const { swarmProvider } = require('../../config');

const _UPLOADERS_BY_CODE = { // Used in account configurations.
  s3: S3Uploader,
  swarm: SwarmUploader,
  inMemory: InMemoryUploader,
};

const _COMMON_OPTIONS = {
  swarm: {
    providerUrl: swarmProvider,
  },
};

/**
 * Specific combination of off-chain uploaders to be used.
 */
class UploaderConfig {
  /**
   * @param {Object} uploaders Mapping of dot-separated
   *                 field paths to OffChainUploader instances.
   */
  constructor (uploaders) {
    if (!uploaders || !uploaders.root) {
      throw new Error('No default (`root`) offchain uploader specified!');
    }
    this.uploaders = uploaders;
  }

  /**
   * Create an UploaderConfig instance from account data.
   *
   * @param {Object} account
   */
  static fromAccount (account) {
    const config = account.uploaders,
      opts = {};
    for (let documentKey in config) {
      const uploaderKey = Object.keys(config[documentKey])[0];
      if (uploaderKey in _UPLOADERS_BY_CODE) {
        const uploaderOpts = Object.assign({}, config[documentKey][uploaderKey],
          _COMMON_OPTIONS[uploaderKey]);
        opts[documentKey] = new _UPLOADERS_BY_CODE[uploaderKey](uploaderOpts);
      } else {
        throw new Error(`Unknown uploader type: ${uploaderKey}`);
      }
    }
    return new UploaderConfig(opts);
  }

  /**
   * Get off-chain uploader for the specified data subtree.
   */
  getUploader (subtree) {
    return this.uploaders[subtree] || this.uploaders.root;
  }
};

module.exports = {
  S3Uploader,
  SwarmUploader,
  UploaderConfig,
};
