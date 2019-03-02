const dxInteracts = artifacts.require("./dxInteracts.sol");
const DutchExchangeProxy = artifacts.require("DutchExchangeProxy")

module.exports = async (deployer, network, accounts) => {

    const dxProxy = await DutchExchangeProxy.deployed()
    console.log("Deploying dxInteracts with %s as the DutchExchange contract", dxProxy.address)

    const dxi = await deployer.deploy(dxInteracts, dxProxy.address)
    console.log("dxi deployed at %s", dxi.address)
}