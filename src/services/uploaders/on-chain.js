/**
 * Base class for all on-chain uploaders.
 */
class OnChainUploader {
  /**
   * Create or update hotel with the given dataIndexUri.
   *
   * @param {string} password Wallet password
   * @param {string} dataIndexUri
   * @param {string} hotelAddress (optional)
   * @return {Promise<string>} Etherum address of the uploaded
   * data.
   */
  upload (password, dataIndexUri, hotelAddress) {
    return Promise.reject(new Error('Not implemented'));
  }

  /**
   * Remove the hotel from WT index.
   *
   * @param {string} password Wallet password
   * @param {string} hotelAddress
   * @return {Promise<void>}
   */
  remove (password, hotelAddress) {
    return Promise.reject(new Error('Not implemented'));
  }
};

/**
 * A dummy implementation of on-chain uploader that doesn't
 * actually do anything - useful for testing.
 */
class DummyUploader extends OnChainUploader {
  upload (password, dataIndexUri, hotelAddress) {
    return Promise.resolve(hotelAddress || 'dummyAddress');
  }

  remove (password, hotelAddress) {
    return Promise.resolve();
  }
};

/**
 * An actual implementation of on-chain uploader.
 */
class WTUploader extends OnChainUploader {
  constructor (wtLibs, wtIndexAddress, walletData) {
    super();
    this.wtLibs = wtLibs;
    this.wtIndexAddress = wtIndexAddress;
    this.wallet = wtLibs.createWallet(walletData); // Note: this is a promise.
  }

  _getWTIndex () {
    return this.wtLibs.getWTIndex(this.wtIndexAddress);
  }

  async _addHotel (password, dataIndexUri) {
    const index = await this._getWTIndex();
    const wallet = await this.wallet;

    wallet.unlock(password);
    try {
      const { hotel, transactionData, eventCallbacks } = await index.addHotel({
        manager: wallet.getAddress(),
        dataUri: dataIndexUri,
      });
      await wallet.signAndSendTransaction(transactionData, eventCallbacks);
      // Once the transaction is mined, one of the callbacks
      // sets the address.
      return hotel.address;
    } finally {
      wallet.lock();
    }
  }

  async _updateHotel (password, dataIndexUri, hotelAddress) {
    const index = await this._getWTIndex();
    const wallet = await this.wallet;
    const hotel = await index.getHotel(hotelAddress);
    hotel.dataUri = dataIndexUri;
    const transactionDataList = await index.updateHotel(hotel);
    wallet.unlock(password);
    try {
      let transactions = [];
      for (let { transactionData, eventCallbacks } of transactionDataList) {
        transactions.push(wallet.signAndSendTransaction(transactionData, eventCallbacks));
      }
      await Promise.all(transactions);
    } finally {
      wallet.lock();
    }
    return hotelAddress;
  }

  upload (password, dataIndexUri, hotelAddress) {
    if (hotelAddress) {
      return this._updateHotel(password, dataIndexUri, hotelAddress);
    }
    return this._addHotel(password, dataIndexUri);
  }

  async remove (password, hotelAddress) {
    const index = await this._getWTIndex();
    const wallet = await this.wallet;
    wallet.unlock(password);
    const hotel = await index.getHotel(hotelAddress);
    try {
      const { transactionData, eventCallbacks } = await index.removeHotel(hotel);
      await wallet.signAndSendTransaction(transactionData, eventCallbacks);
    } finally {
      wallet.lock();
    }
  }
};

module.exports = {
  OnChainUploader: OnChainUploader,
  DummyUploader: DummyUploader,
  WTUploader: WTUploader,
};
