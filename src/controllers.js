module.exports.createHotel = async (req, res, next) => {
  // TODO: 1. Validate request.
  // 2. Upload the actual data parts.
  let dataIndex = {};
  for (let subtree of ['description', 'ratePlans', 'availability']) {
    let uploader = req.uploaders.getUploader(subtree);
    dataIndex[`${subtree}Uri`] = await uploader.upload(req.body[subtree]);
  }
  // 3. Upload the data index.
  const dataIndexUri = await req.uploaders.getUploader('root').upload(dataIndex);

  // 4. Upload the resulting data to ethereum.
  await req.uploaders.onChain.upload(dataIndexUri);
  res.sendStatus(204);
};
