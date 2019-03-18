const EventEmitter = artifacts.require("EventEmitter");
const EventEmitterVerifier = artifacts.require("EventEmitterVerifier"); 
const DxiTriggerPostSellOrder = artifacts.require("DxiTriggerPostSellOrder");
const DxInteracts = artifacts.require("DxInteracts");

module.exports = async (deployer) => {
  try {
      deployer.deploy(EventEmitter)
      .then(() => EventEmitter.deployed)
      .then(() => deployer.deploy(EventEmitterVerifier))
      .then(() => EventEmitterVerifier.deployed)
      .then(() => deployer.deploy(DxiTriggerPostSellOrder, DxInteracts.address, EventEmitterVerifier.address))
      .then(() => DxiTriggerPostSellOrder.deployed)

      console.log('Event verification contracts deployed');
  } catch(err) {
    console.log('ERROR on deploy:',err);
  }

};