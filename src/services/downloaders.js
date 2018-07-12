const config = require('../config');
const { DATA_INDEX_FIELDS } = require('../data-interface');

/**
 * Downloader based on the WT library.
 *
 * The downloader is responsible for returning hotel data
 * - on-chain as well as off-chain.
 */
class WTDownloader {
  constructor (wtLibs, wtIndexAddress) {
    this.wtLibs = wtLibs;
    this.wtIndexAddress = wtIndexAddress;
  }

  async _getRawIndex (hotelAddress) {
    const index = await this.wtLibs.getWTIndex(this.wtIndexAddress);
    const hotel = await index.getHotel(hotelAddress);
    return hotel.dataIndex;
  };

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

let _DOWNLOADER;

/**
 * Get the previously set downloader.
 */
function get () {
  if (!_DOWNLOADER) {
    throw new Error('No downloader has been set!');
  }
  return _DOWNLOADER;
}

/**
 * Set downloader during runtime.
 */
function set (downloader) {
  if (!_DOWNLOADER) {
    _DOWNLOADER = new WTDownloader(config.wtLibs, config.wtIndexAddress);
  }
  _DOWNLOADER = downloader;
}

module.exports = {
  WTDownloader,
  get,
  set,
};
