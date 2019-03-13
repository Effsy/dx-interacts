const Ion = artifacts.require("Ion");
const Base = artifacts.require("Base");
const EthereumStore = artifacts.require("EthereumStore");
const DxiClaimAuction = artifacts.require("DxiClaimAuction");
const DxAuctionClearedEventVerifier = artifacts.require("DxAuctionClearedEventVerifier");
const DxInteracts = artifacts.require("DxInteracts");

module.exports = async (deployer) => {
  try {
      deployer.deploy(Ion)
      .then(() => Ion.deployed)
      .then(() => deployer.deploy(EthereumStore, Ion.address))
      .then(() => EthereumStore.deployed)
      .then(() => deployer.deploy(Base, Ion.address))
      .then(() => Base.deployed)
      .then(() => deployer.deploy(DxAuctionClearedEventVerifier))
      .then(() => DxAuctionClearedEventVerifier.deployed)
      .then(() => deployer.deploy(DxiClaimAuction, EthereumStore.address, DxAuctionClearedEventVerifier.address, DxInteracts.address))
      .then(() => DxiClaimAuction.deployed)

      console.log('Ion contracts deployed');
  } catch(err) {
    console.log('ERROR on deploy:',err);
  }

};