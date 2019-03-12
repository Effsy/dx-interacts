const Ion = artifacts.require("Ion");
const Base = artifacts.require("Base");
const EthereumStore = artifacts.require("EthereumStore");
const ClaimAndWithdraw = artifacts.require("ClaimAndWithdraw");
const ClaimAndWithdrawEventVerifier = artifacts.require("ClaimAndWithdrawEventVerifier");

module.exports = async (deployer) => {
  try {
      deployer.deploy(Ion)
      .then(() => Ion.deployed)
      .then(() => deployer.deploy(EthereumStore, Ion.address))
      .then(() => EthereumStore.deployed)
      .then(() => deployer.deploy(Base, Ion.address))
      .then(() => Base.deployed)
      .then(() => deployer.deploy(DepositEventVerifier))
      .then(() => DepositEventVerifier.deployed)
      .then(() => deployer.deploy(EventFunction, Ion.address, DepositEventVerifier.address))
      .then(() => EventFunction.deployed)

      console.log('Ion contracts deployed');
  } catch(err) {
    console.log('ERROR on deploy:',err);
  }

};