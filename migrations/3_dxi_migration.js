const dxInteracts = artifacts.require("./dxInteracts.sol");

module.exports = async (deployer, network, accounts) => {  
    dxAddress = "0x26ec4546B4265501591e46d806A76d91905f1787"
    console.log('Deploying Safe with %s as the DutchExchange contract', dxAddress)

    await deployer.deploy(dxInteracts, dxAddress)
}