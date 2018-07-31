const TruffleContract = require('truffle-contract');
const Web3 = require('web3');
const WTIndexContract = require('@windingtree/wt-contracts/build/contracts/WTIndex');
const { ethereumProvider } = require('../config');

const provider = new Web3.providers.HttpProvider(ethereumProvider);
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

/**
 * Deploy wt index to the network (for development purposes).
 */
const deployIndex = async () => {
  const indexContract = getContractWithProvider(WTIndexContract, provider);
  const accounts = await web3.eth.getAccounts();
  return indexContract.new({
    from: accounts[0],
    gas: 6000000,
  });
};

module.exports = {
  deployIndex,
};
