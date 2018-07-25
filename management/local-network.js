const TruffleContract = require('truffle-contract');
const Web3 = require('web3');
const WTIndexContract = require('@windingtree/wt-contracts/build/contracts/WTIndex');

const provider = new Web3.providers.HttpProvider('http://localhost:8545');
const web3 = new Web3(provider);

// dirty hack for web3@1.0.0 support for localhost testrpc, see
// https://github.com/trufflesuite/truffle-contract/issues/56#issuecomment-331084530
const hackInSendAsync = (instance) => {
  if (typeof instance.currentProvider.sendAsync !== 'function') {
    instance.currentProvider.sendAsync = function () {
      return instance.currentProvider.send.apply(
        instance.currentProvider, arguments
      );
    };
  }
  return instance;
};

const getContractWithProvider = (metadata, provider) => {
  let contract = new TruffleContract(metadata);
  contract.setProvider(provider);
  contract = hackInSendAsync(contract);
  return contract;
};

const deployIndex = async () => {
  const indexContract = getContractWithProvider(WTIndexContract, provider);
  const accounts = await web3.eth.getAccounts();
  return indexContract.new({
    from: accounts[0],
    gas: 6000000,
  });
};

const deployFullHotel = async (offChainDataAdapter, index, hotelDescription, ratePlan) => {
  const descriptionUri = await offChainDataAdapter.upload(hotelDescription);
  const ratePlansUri = await offChainDataAdapter.upload(ratePlan);
  const accounts = await web3.eth.getAccounts();
  const dataUri = await offChainDataAdapter.upload({
    descriptionUri,
    ratePlansUri,
  });

  const registerResult = await index.registerHotel(dataUri, {
    from: accounts[0],
    gas: 6000000,
  });
  return web3.utils.toChecksumAddress(registerResult.logs[0].args.hotel);
};

module.exports = {
  deployIndex,
  deployFullHotel,
};
