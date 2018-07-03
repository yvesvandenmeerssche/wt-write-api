const env = process.env.NODE_ENV || 'dev';
const DummyOnChainUploader = require('../services/uploaders/on-chain').DummyUploader;
const DummyOffChainUploader = require('../services/uploaders/off-chain').DummyUploader;
const { UploaderConfig } = require('../services/uploaders/config');

module.exports = Object.assign({
  // For now, uploader config is hardcoded here. In the future,
  // we assume it will be retrieved dynamically based on user
  // credentials present in the header.
  uploaders: new UploaderConfig(new DummyOnChainUploader(), {
    'root': new DummyOffChainUploader(),
    /* Alternatively:
    'root': new S3Uploader({
      'accessKeyId': '...',
      'secretAccessKey': '...',
      'region': 'eu-central-1',
      'bucket': 'bucket',
    }); */
  }),
}, require(`./${env}`));
