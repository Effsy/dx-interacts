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
web3.providers.HttpProvider.prototype.sendAsync = web3.providers.HttpProvider.prototype.send;
  
const BigNumber = require('bignumber.js');
var chai = require('chai');
chai.use(require('chai-bignumber')(BigNumber));
// const { waitUntilBlock } = require('@digix/tempo')(web3)
const { wait } = require('@digix/tempo')(web3)
// console.log(wait);

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


contract('DxInteracts - claim and withdrawal', accounts => {
  // const [, seller1] = accounts
  const [, seller1, seller2, buyer1, buyer2] = accounts

  
  
  before(async () => {
      eth = await EtherToken.deployed();
      gno = await TokenGNO.deployed();
      mgn = await TokenFRT.deployed();
      dx = await DutchExchange.at(DutchExchangeProxy.address);
      dxi = await DxInteracts.deployed();
      
      feeRatio = 1 / 200;
      
      await addTokenPair();
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
  
  const addTokenPair = async () => {
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
  }  

  const postSellOrderWithDxi = async () => {

    

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
  }

    /**
   * postSellOrder
   * @param {address} ST      => Sell Token
   * @param {address} BT      => Buy Token
   * @param {uint}    aucIdx  => auctionIndex
   * @param {uint}    amt     => amount
   *
   * @returns { tx receipt }
   */
  const postSellOrder = async (ST, BT, aucIdx, amt, acct) => {
    ST = ST || eth; BT = BT || gno
    let auctionIdx = aucIdx || 0

    const buyVolumes = (await dx.buyVolumes.call(ST.address, BT.address))
    const sellVolumes = (await dx.sellVolumesCurrent.call(ST.address, BT.address))
    console.log(`
      Current Buy Volume BEFORE Posting => ${buyVolumes}
      Current Sell Volume               => ${sellVolumes}
      ----
      Posting Sell Amt -------------------> ${amt} in ${await ST.symbol()} for ${await BT.symbol()} in auction ${auctionIdx}
    `)
    
    // log('POSTBUYORDER TX RECEIPT ==', await dx.postBuyOrder(ST.address, BT.address, auctionIdx, amt, { from: acct }))
    // console.log({ st: ST.address, bt: BT.address, auctionIdx, amt, from: acct })
    return dx.postSellOrder(ST.address, BT.address, auctionIdx, amt, { from: acct })
  }

    /**
   * waitUntilPriceIsXPercentOfPreviousPrice
   * @param {address} ST  => Sell Token
   * @param {address} BT  => Buy Token
   * @param {unit}    p   => percentage of the previous price
   */
  const waitUntilPriceIsXPercentOfPreviousPrice = async (ST, BT, p) => {
    const [getAuctionIndex, getAuctionStart] = await Promise.all([
      dx.getAuctionIndex.call(ST.address, BT.address),
      dx.getAuctionStart.call(ST.address, BT.address)
    ])

    const currentIndex = getAuctionIndex
    const startingTimeOfAuction = getAuctionStart
    let priceBefore = 1

    
    let result = (await dx.getCurrentAuctionPrice.call(ST.address, BT.address, currentIndex))
    let num = result[0]
    let den = result[1]
    // console.log(await dx.getCurrentAuctionPrice.call(ST.address, BT.address, currentIndex))
    priceBefore = num.div(den)
    
    console.log(`
    Price BEFORE waiting until Price = initial Closing Price (2) * 2
    ==============================
    Price.num             = ${num}
    Price.den             = ${den}
    Price at this moment  = ${(priceBefore)}
    ==============================
    `)
    
    
    const timeToWaitFor = Math.ceil((86400 - p * 43200) / (1 + p)) + startingTimeOfAuction
    // wait until the price is good
    await wait(startingTimeOfAuction - timestamp())
    
    
    (result = (await dx.getCurrentAuctionPrice.call(ST.address, BT.address, currentIndex)))
    num = result[0]
    den = result[1]
    const priceAfter = num.div(den)
    console.log(`
      Price AFTER waiting until Price = ${p * 100}% of ${priceBefore / 2} (initial Closing Price)
      ==============================
      Price.num             = ${num}
      Price.den             = ${den}
      Price at this moment  = ${(priceAfter)}
      ==============================
    `)
    
    assert.equal(timestamp() >= timeToWaitFor, true)
    // assert.isAtLeast(priceAfter, (priceBefore / 2) * p)

    return timeToWaitFor
  }

  const getClearingTime = async (sellToken, buyToken, auctionIndex) => {
    return (await dx.getClearingTime.call(sellToken.address ||
      sellToken, buyToken.address ||
      buyToken, auctionIndex))
  }
  
    /**
   * postBuyOrder
   * @param {address} ST      => Sell Token
   * @param {address} BT      => Buy Token
   * @param {uint}    aucIdx  => auctionIndex
   * @param {uint}    amt     => amount
   *
   * @returns { tx receipt }
   */
  const postBuyOrder = async (ST, BT, aucIdx, amt, acct) => {
    ST = ST || eth; BT = BT || gno
    let auctionIdx = aucIdx || await getAuctionIndex(ST, BT)

    console.log(`
    Current Auction Index -> ${auctionIdx}
    `)
    const buyVolumes = (await dx.buyVolumes.call(ST.address, BT.address))
    const sellVolumes = (await dx.sellVolumesCurrent.call(ST.address, BT.address))
    console.log(`
      Current Buy Volume BEFORE Posting => ${buyVolumes}
      Current Sell Volume               => ${sellVolumes}
      ----
      Posting Buy Amt -------------------> ${amt} in GNO for ETH
    `)

    // log('POSTBUYORDER TX RECEIPT ==', await dx.postBuyOrder(ST.address, BT.address, auctionIdx, amt, { from: acct }))
    return dx.postBuyOrder(ST.address, BT.address, auctionIdx, amt, { from: acct })
  }


  it('user can claim his tokens when auction is closed', async () => {
    await postSellOrderWithDxi();
    // TODO: test claiming functionality
    // prepare test by starting and clearing new auction
    let auctionIndex = await getAuctionIndex(eth, gno)
    await Promise.all([
      postSellOrder(gno, eth, 0, BigNumber(10e18), seller2),
      postSellOrder(eth, gno, 0, BigNumber(10e18), seller2)
    ])
    await waitUntilPriceIsXPercentOfPreviousPrice(eth, gno, 1)
    await postBuyOrder(eth, gno, auctionIndex, 2 * BigNumber(10e18), buyer1)

    // check that clearingTime was saved
    const clearingTime = await getClearingTime(gno, eth, auctionIndex)
    const now = timestamp()
    assert.equal(clearingTime, now, 'clearingTime was set')

    auctionIndex = await getAuctionIndex()
    await setAndCheckAuctionStarted(eth, gno)
    assert.equal(2, auctionIndex)

    // now claiming should not be possible and return == 0
    await setAndCheckAuctionStarted(eth, gno)
    await waitUntilPriceIsXPercentOfPreviousPrice(eth, gno, 1.5)
    const [closingPriceNum] = (await dx.closingPrices.call(gno.address, eth.address, auctionIndex - 1)).map(i => i.toNumber())

    // checking that test is executed correctly
    assert.equal(closingPriceNum, 0)
    logger('here it is', closingPriceNum)
    const [claimedAmount] = (await dx.claimBuyerFunds.call(gno.address, eth.address, buyer1, auctionIndex - 1)).map(i => i.toNumber())

    // checking that right amount is claimed
    assert.equal(claimedAmount, 0)
  })
})
