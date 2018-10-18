const _ = require('lodash');

const { validateDescription, validateRatePlans, validateAvailability,
  validateNotifications, validateBooking } = require('./validators');

/* A declarative description of hotel data. */
const DATA_INDEX_FIELDS = [
  {
    name: 'description',
    required: true,
    pointer: true, // Is this a pointer to another subdocument?
    validator: validateDescription,
  },
  {
    name: 'ratePlans',
    required: false,
    pointer: true,
    validator: validateRatePlans,
  },
  {
    name: 'availability',
    required: false,
    pointer: true,
    validator: validateAvailability,
  },
  {
    name: 'notifications',
    required: false,
    pointer: false,
    validator: validateNotifications,
  },
  {
    name: 'booking',
    required: false,
    pointer: false,
    validator: validateBooking,
  },
];
const DATA_INDEX_FIELD_NAMES = _.map(DATA_INDEX_FIELDS, 'name');

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
    const index = this._getWTIndex();
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
    const index = this._getWTIndex();
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
  createWallet (walletData) {
    return this.wtLibs.createWallet(walletData);
  }

  /**
   * Create or update hotel with the given dataIndexUri.
   *
   * @param {Function} withWallet
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
   * @param {Function} withWallet
   * @param {string} hotelAddress
   * @return {Promise<void>}
   */
  async remove (withWallet, hotelAddress) {
    const index = this._getWTIndex();
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
    const rawIndex = await this._getRawIndex(hotelAddress),
      contents = {},
      indexContents = await rawIndex.contents;
    for (let field of DATA_INDEX_FIELDS) {
      const name = `${field.name}Uri`;
      if (field.pointer) {
        contents[name] = _.get(indexContents, [name, 'ref']);
      } else {
        contents[name] = indexContents[name];
      }
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
    const rawIndex = await this._getRawIndex(hotelAddress),
      data = {},
      contents = await rawIndex.contents;
    for (let fieldName of fieldNames) {
      let doc = contents[`${fieldName}Uri`];
      if (doc) {
        if (doc.toPlainObject) {
          data[`${fieldName}`] = (await doc.toPlainObject()).contents;
        } else { // No pointer.
          data[`${fieldName}`] = doc;
        }
      }
    }
    return data;
  }

  /**
   * Return true, if the provided ethereum address is non-zero
   * and valid, false otherwise.
   *
   * @param {string} address
   */
  isValidAddress (address) {
    return !this.wtLibs.dataModel.web3Utils.isZeroAddress(address);
  }

  /**
   * Transfer hotel to a different manager.
   *
   * @param {Function} withWallet
   * @param {string} hotelAddress
   * @param {string} managerAddress
   * @return {Promise<void>}
   */
  async transferHotel (withWallet, hotelAddress, managerAddress) {
    const index = this._getWTIndex();
    const hotel = await index.getHotel(hotelAddress);
    const { transactionData, eventCallbacks } = await index.transferHotelOwnership(
      hotel, managerAddress);
    await withWallet(async (wallet) => {
      await wallet.signAndSendTransaction(transactionData, eventCallbacks);
    });
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
  DATA_INDEX_FIELDS,
  DATA_INDEX_FIELD_NAMES,
};
