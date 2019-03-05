const Ion = artifacts.require("Ion");
const Base = artifacts.require("Base");
const EthereumStore = artifacts.require("EthereumStore");
const EventFunction = artifacts.require("Function");
const DepositEventVerifier = artifacts.require("DepositEventVerifier");

module.exports = async (deployer) => {
  try {
      deployer.deploy(Ion, "0x6341fd3daf94b748c72ced5a5b26028f2474f5f00d824504e4fa37a75767e177")
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