const SwarmAdapter = require('@windingtree/off-chain-adapter-swarm');

const { HttpBadGatewayError } = require('../../errors');
const { OffChainUploader } = require('./base');

/**
 * Uploader for Ethereum Swarm.
 */
class SwarmUploader extends OffChainUploader {
  /**
   * The following configuration can be provided:
   * - providerUrl: address of a Swarm gateway. Mandatory.
   * - timeout: General timeout. Will be used for both read and write.
   * - timeoutRead: Read timeout, overwrites the general timeout.
   * - timeoutWrite: Write timeout, overwrites the general timeout.
   */
  constructor (options) {
    if (!options.providerUrl) {
      throw new Error('Missing required option: providerUrl');
    }
    super();
    this._swarmAdapter = new SwarmAdapter({
      swarmProviderUrl: options.providerUrl,
      timeout: options.timeout,
      timeoutRead: options.timeoutRead,
      timeoutWrite: options.timeoutWrite,
    });
  }

  async upload (data, label, preferredUrl) {
    await super.upload(data, label, preferredUrl);
    try {
      return (await this._swarmAdapter.upload(data));
    } catch (err) {
      if (err.message && err.message.match(/Error \d\d\d\.|ECONNREFUSED/)) {
        let msg = `Invalid response from upstream (Swarm): ${err.message}`;
        throw new HttpBadGatewayError('badGatewayError', msg);
      }
      throw err;
    }
  }
};

module.exports = {
  SwarmUploader,
};
