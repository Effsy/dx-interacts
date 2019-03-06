const bn = require("bignumber.js")
const dx = artifacts.require("DutchExchange")
const dxProxy = artifacts.require("DutchExchangeProxy")
const gno = artifacts.require("TokenGNO")
const weth = artifacts.require("EtherToken")
const mgn = artifacts.require("TokenFRT")

global.artifacts = artifacts;
global.web3 = web3;

Number.prototype.toWei = function toWei () {
    return bn(this, 10).times(10 ** 18)
}

async function main() {
    let dxExchange = await dx.at(dxProxy.address);
    let ethToken = await dxExchange.ethToken.call();
    console.log(ethToken === weth.address);

    // const testingAccs = accounts.slice(1, 5);
    const ETHBalance = 50..toWei();
    const initialToken1Funding = 10..toWei();
    console.log("here")
    const tweth = await weth.deployed();
    const accs = await web3.eth.getAccounts();

    accs.map(async acc => {
        let balance = await tweth.balanceOf.call(acc)
        console.log(balance.toString())
    })

    await Promise.all(accs.map(acc => Promise.all([
        tweth.deposit({ from: acc, value: ETHBalance }),
        tweth.approve(dxProxy.address, ETHBalance, { from: acc })
    ])))

    accs.map(async acc => {
        let balance = await tweth.balanceOf.call(acc)
        console.log(balance.toString())
    })

    // await dxExchange.deposit(tweth.address, ETHBalance / 2, { from: acc });

    // accs.map(async acc => 
    //     dxExchange.deposit(tweth.address, ETHBalance / 2, { from: acc })
    // )

    // dx.addTokenPair(eth.address, gno.address, initialToken1Funding, 0, 2, 1, { from: accounts[1] })
    
}

module.exports = async function(callback) {
    const startBal = {
        startingETH: 90.0.toWei(),
        startingGNO: 90.0.toWei(),
        ethUSDPrice: 1008.0.toWei(),
        sellingAmount: 50.0.toWei()
    }

    await main();
}
