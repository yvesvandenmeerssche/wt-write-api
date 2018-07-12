const { DATA_INDEX_FIELDS } = require('../data-interface');

/**
 * Gateway to the WT platform. Wraps wtLibs.
 */
class WT {
  constructor (wtLibs, wtIndexAddress) {
    this.wtLibs = wtLibs;
    this.wtIndexAddress = wtIndexAddress;
  }

  _getWTIndex () {
    return this.wtLibs.getWTIndex(this.wtIndexAddress);
  }

  async _addHotel (withWallet, dataIndexUri) {
    const index = await this._getWTIndex();
    return withWallet(async (wallet) => {
      const { hotel, transactionData, eventCallbacks } = await index.addHotel({
        manager: wallet.getAddress(),
        dataUri: dataIndexUri,
      });
      await wallet.signAndSendTransaction(transactionData, eventCallbacks);
      // Once the transaction is mined, one of the callbacks
      // sets the address.
      return hotel.address;
    });
  }

  async _updateHotel (withWallet, dataIndexUri, hotelAddress) {
    const index = await this._getWTIndex();
    const hotel = await index.getHotel(hotelAddress);
    hotel.dataUri = dataIndexUri;
    const transactionDataList = await index.updateHotel(hotel);
    await withWallet(async (wallet) => {
      let transactions = [];
      for (let { transactionData, eventCallbacks } of transactionDataList) {
        transactions.push(wallet.signAndSendTransaction(transactionData, eventCallbacks));
      }
      await Promise.all(transactions);
    });
    return hotelAddress;
  }

  async _getRawIndex (hotelAddress) {
    const index = await this.wtLibs.getWTIndex(this.wtIndexAddress);
    const hotel = await index.getHotel(hotelAddress);
    return hotel.dataIndex;
  }

  /**
   * Return a wallet.
   *
   * @param {Object} walletData
   */
  async createWallet (walletData) {
    return this.wtLibs.createWallet(walletData);
  }

  /**
   * Create or update hotel with the given dataIndexUri.
   *
   * @param {string} password Wallet password
   * @param {string} dataIndexUri
   * @param {string} hotelAddress (optional)
   * @return {Promise<string>} Etherum address of the uploaded
   * data.
   */
  upload (withWallet, dataIndexUri, hotelAddress) {
    if (hotelAddress) {
      return this._updateHotel(withWallet, dataIndexUri, hotelAddress);
    }
    return this._addHotel(withWallet, dataIndexUri);
  }

  /**
   * Remove the hotel from WT index.
   *
   * @param {string} password Wallet password
   * @param {string} hotelAddress
   * @return {Promise<void>}
   */
  async remove (withWallet, hotelAddress) {
    const index = await this._getWTIndex();
    const hotel = await index.getHotel(hotelAddress);
    const { transactionData, eventCallbacks } = await index.removeHotel(hotel);
    await withWallet(async (wallet) => {
      await wallet.signAndSendTransaction(transactionData, eventCallbacks);
    });
  }

  /**
   * Return the hotel's data index.
   *
   * @param {string} hotelAddress
   * @return {Promise<Object>}
   */
  async getDataIndex (hotelAddress) {
    const rawIndex = await this._getRawIndex(hotelAddress);
    let contents = {};
    for (let field of DATA_INDEX_FIELDS) {
      let uri = await rawIndex.contents[`${field.name}Uri`];
      contents[`${field.name}Uri`] = uri && uri.ref;
    }
    return {
      ref: rawIndex.ref,
      contents: contents,
    };
  }

  /**
   * Return resolved hotel data.
   *
   * @param {string} hotelAddress
   * @param {Array} fieldNames (required) Only include these fields.
   * @return {Promise<Object>}
   */
  async getDocuments (hotelAddress, fieldNames) {
    const rawIndex = await this._getRawIndex(hotelAddress);
    let data = {};
    for (let fieldName of fieldNames) {
      let doc = await rawIndex.contents[`${fieldName}Uri`];
      data[`${fieldName}`] = (await doc.toPlainObject()).contents;
    }
    return data;
  }
};

let _WT;

/**
 * Get the previously set WT instance.
 */
function get () {
  if (!_WT) {
    throw new Error('No WT instance has been set!');
  }
  return _WT;
}

/**
 * Set WT instance during runtime.
 */
function set (wt) {
  _WT = wt;
}

module.exports = {
  WT,
  get,
  set,
};
