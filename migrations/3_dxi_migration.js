const dxInteracts = artifacts.require("./DxInteracts.sol");
const DutchExchangeProxy = artifacts.require("DutchExchangeProxy");
const EtherToken = artifacts.require('EtherToken');

module.exports = async (deployer, network, accounts) => {

    // const dxProxy = await DutchExchangeProxy.deployed();
    const dxProxy = "0xaaeb2035ff394fdb2c879190f95e7676f1a9444b";
    const ethToken = "0xc778417e063141139fce010982780140aa0cd5ab";

    console.log("Deploying dxInteracts with %s as the DutchExchange contract", dxProxy);
    console.log("weth address set as %s ", ethToken);

    const dxi = await deployer.deploy(dxInteracts, dxProxy, ethToken);
    
    console.log("dxi deployed at %s", dxi.address);
}