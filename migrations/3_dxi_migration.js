const dxInteracts = artifacts.require("./DxInteracts.sol");
const DutchExchangeProxy = artifacts.require("DutchExchangeProxy");
const EtherToken = artifacts.require('EtherToken');

module.exports = async (deployer, network, accounts) => {

    const dxProxy = await DutchExchangeProxy.deployed();
    const ethToken = await EtherToken.deployed();

    console.log("Deploying dxInteracts with %s as the DutchExchange contract", dxProxy.address);
    console.log("weth address set as %s ", ethToken.address);

    const dxi = await deployer.deploy(dxInteracts, dxProxy.address, ethToken.address);
    
    console.log("dxi deployed at %s", dxi.address);
}