/* global contract, assert */
/* eslint no-undef: "error" */

// const {
//   eventWatcher,
//   log: utilsLog,
//   assertRejects,
//   timestamp,
//   gasLogger
// } = require('./utils')

// const { getContracts, setupTest, wait } = require('./testFunctions')
const BigNumber = require('bignumber.js');
var chai = require('chai');
chai.use(require('chai-bignumber')(BigNumber));


// Test VARS
let eth
let gno
let mgn
let dx
let dxi

let feeRatio

// let contracts

// const separateLogs = () => utilsLog('\n    ----------------------------------')
// const log = (...args) => utilsLog('\t', ...args)

const EtherToken = artifacts.require("EtherToken")
const DutchExchange = artifacts.require("DutchExchange")
const DutchExchangeProxy = artifacts.require("DutchExchangeProxy")
const TokenGNO = artifacts.require("TokenGNO")
const TokenFRT = artifacts.require("TokenFRT")
const DxInteracts = artifacts.require("DxInteracts")


contract('DxInteracts - postSellOrder', accounts => {
  // const [, seller1] = accounts
  
  before(async () => {
    eth = await EtherToken.deployed();
    gno = await TokenGNO.deployed();
    mgn = await TokenFRT.deployed();
    dx = await DutchExchange.at(DutchExchangeProxy.address);
    dxi = await DxInteracts.deployed();

    feeRatio = 1 / 200;
  })


  const getTokenBalance = async (account, token) => (await dx.balances.call(token.address || token, account))

  const getAuctionIndex = async (sellToken, buyToken) =>
    (await dx.getAuctionIndex.call(sellToken.address || sellToken, buyToken.address || buyToken))

  const getAuctionStart = async (sellToken, buyToken) =>
    (await dx.getAuctionStart.call(sellToken.address || sellToken, buyToken.address || buyToken))

  const getSellerBalance = async (account, sellToken, buyToken, auctionIndex) =>
    (await dx.sellerBalances.call(sellToken.address || sellToken, buyToken.address || buyToken, auctionIndex, account))

  const getSellVolumeCurrent = async (sellToken, buyToken) =>
    (await dx.sellVolumesCurrent.call(sellToken.address || sellToken, buyToken.address || buyToken))

  const getSellVolumeNext = async (sellToken, buyToken) =>
    (await dx.sellVolumesNext.call(sellToken.address || sellToken, buyToken.address || buyToken))

  const getChangedAmounts = async (account, sellToken, buyToken, auctionIndex) => {
    const [balance, sellerBalance, sellVolumeCurrent, sellVolumeNext] = await Promise.all([
      getTokenBalance(account, sellToken),
      getSellerBalance(account, sellToken, buyToken, auctionIndex),
      getSellVolumeCurrent(sellToken, buyToken),
      getSellVolumeNext(sellToken, buyToken)
    ])

    console.log(`
      balance\t\t==\t${balance}
      sellerBalance\t==\t${sellerBalance}

      for auctionIndex ${auctionIndex}
      sellVolumeCurrent\t==\t${sellVolumeCurrent}
      sellVolumeNext\t==\t${sellVolumeNext}
    `)

    return {
      balance,
      sellerBalance,
      sellVolumeCurrent,
      sellVolumeNext
    }
  }

  const timestamp = async (block = 'latest') => (await web3.eth.getBlock(block)).timestamp;


  const assertChangedAmounts = (oldAmounts, newAmounts, amount, amountAfterFee, postedToCurrentAuction) =>
    Object.keys(newAmounts).forEach(key => {
      const oldVal = BigNumber(oldAmounts[key])
      const newVal = BigNumber(newAmounts[key])

      // console.log
      // const incByAmountAfterFee = () => assert.strictEqual(oldVal + amountAfterFee, newVal.toString(), `${key} should be increased by amountAfterFee`)
      const incByAmountAfterFee = () => chai.expect( (oldVal.add(amountAfterFee)).toString() ).to.be.bignumber.equal(newVal.toString());
      const remainTheSame = () => chai.expect( oldVal.toString() ).to.be.bignumber.equal(newVal.toString());
      // const remainTheSame = () => assert.strictEqual(oldVal, newVal, `${key} should remain the same`)
      
      switch (key) {
        case 'balance':
          // assert.strictEqual(oldVal - amount, newVal, 'balance should be reduced by amount')
          chai.expect( (oldVal.minus(amount)).toString() ).to.be.bignumber.equal(newVal.toString());
          return
        case 'sellerBalance':
          incByAmountAfterFee()
          return
        case 'sellVolumeCurrent':
          if (postedToCurrentAuction) incByAmountAfterFee()
          else remainTheSame()
          return
        case 'sellVolumeNext':
          if (!postedToCurrentAuction) incByAmountAfterFee()
          else remainTheSame()
          break
        default:
      }
    })

  const getAmountAfterFee = amount => Math.floor(amount - Math.floor(amount * feeRatio))

  const getEventFromTX = ({ logs }, eventName) => {
    const event = logs.find(l => l.event === eventName)
    if (event) return event.args.auctionIndex

    return null
  }
  

  it('sets up dxi token balances and adds token pair to dx', async () => {
    // deposit 20 ETH into DX
    const toWei = BigNumber(10).pow(18);
    const eth20 = BigNumber(20).times(toWei);
    const startingGNO = BigNumber(50).times(toWei);

    // fund DxInteracts with GNO then deposit in the DutchExchange
    await gno.transfer(dxi.address, startingGNO, { from: accounts[0] });    
    await dxi.depositToken(gno.address, startingGNO);


    // gno token balance in the dutchExchange, not the same as the previous value!
    const gnoBalance = await getTokenBalance(dxi.address, gno.address);
    
    // WETH Balance that DxInteracts holds in the DutchExchange
    await dxi.depositEther({value: eth20});
    const ethBalance = await getTokenBalance(dxi.address, eth.address);
    
    chai.expect(ethBalance.toString()).to.be.bignumber.at.least(0);
    chai.expect(gnoBalance.toString()).to.be.bignumber.at.least(0);

    await dxi.addTokenPair(
      eth.address,
      gno.address,
      eth20.div(2),
      0,
      2,
      1
    )
  })


  it('balances are correctly changed when auction isn\'t running and sell order is posted to that auction', async () => {
    const latestAuctionIndex = await getAuctionIndex(eth, gno)

    chai.expect(latestAuctionIndex.toString()).to.be.bignumber.equal(1);
    
    const timestampNow = await timestamp();
    const auctionStart = await getAuctionStart(eth, gno)
    const postedToCurrentAuction = timestampNow < auctionStart || auctionStart === 1
    // assert.isAbove(auctionStart, timestamp(), 'auction isn\'t yet running')
    chai.expect(auctionStart.toString()).to.be.bignumber.at.least(timestampNow);
    console.log(`auction #${latestAuctionIndex} isn't yet running`)
    
    const amount = 10000
    chai.expect(amount.toString()).to.be.bignumber.at.least(0);
    
    const amountAfterFee = getAmountAfterFee(amount)
    chai.expect(amountAfterFee.toString()).to.be.bignumber.at.least(0);
    
    const auctionIndex = latestAuctionIndex
    chai.expect(auctionIndex.toString()).to.be.bignumber.equal(latestAuctionIndex.toString());

    const oldAmounts = await getChangedAmounts(dxi.address, eth, gno, latestAuctionIndex)
    console.log(`oldAmounts: sell volume ${oldAmounts.sellVolumeCurrent}, balance ${oldAmounts.balance}`)

    console.log(`posting sell order for ${amount} (after fee ${amountAfterFee}) to auction #${auctionIndex}(current)`)
    await dxi.postSellOrder(eth.address, gno.address, auctionIndex, amount)

    const newAmounts = await getChangedAmounts(dxi.address, eth, gno, latestAuctionIndex)
    console.log(`newAmounts: sell volume ${newAmounts.sellVolumeCurrent}, balance ${newAmounts.balance}`)

    assertChangedAmounts(oldAmounts, newAmounts, amount, amountAfterFee, postedToCurrentAuction)
  })
})
