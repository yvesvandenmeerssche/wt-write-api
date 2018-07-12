const DummyOnChainUploader = require('../services/uploaders/on-chain').DummyUploader;
const DummyOffChainUploader = require('../services/uploaders/off-chain').DummyUploader;
const { UploaderConfig } = require('../services/uploaders/config');

const env = process.env.NODE_ENV || 'dev';

module.exports = Object.assign({
  // For now, uploader config is hardcoded here. In the future,
  // we assume it will be retrieved dynamically based on user
  // credentials present in the header.
  //
  // Due to the logic in controllers and relation between
  // on-chain and off-chain data, a single uploader
  // configuration will probably have to be confined to a single
  // hotel.
  uploaders: new UploaderConfig(new DummyOnChainUploader(), {
    'root': new DummyOffChainUploader(),
  }),
  /* Alternatively:
  uploaders: new UploaderConfig(new WTUploader(wtLibs, wtIndexAddress, walletData), {
    'root': new S3Uploader({
      'accessKeyId': '...',
      'secretAccessKey': '...',
      'region': 'eu-central-1',
      'bucket': 'bucket',
      'keyPrefix': 'my-hotel',
    });
  }),
  */
  walletPassword: 'dummy',
}, require(`./${env}`));
