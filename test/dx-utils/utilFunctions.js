const bn = require(bignumber.js);

const contractNames = [
    'DutchExchangeProxy',
    'EtherToken',
    'OWLAirdrop',
    'TokenGNO',
    'TokenOWLProxy',
    'TokenFRT',
    'TokenFRTProxy',
    'PriceOracleInterface',
    'PriceFeed',
    'Medianizer'
]

Number.prototype.toWei = function toWei () {
    return bn(this, 10).times(10 ** 18);
}


// testing Auction Functions
/**
 * setAndCheckAuctionStarted - gets Auction Idx for curr Token Pair and moves time to auction start if: start = false
 * @param {address} ST - Sell Token
 * @param {address} BT - Buy Token
 */
const setAndCheckAuctionStarted = async (ST, BT) => {
    const { DutchExchange: dx, EtherToken: eth, TokenGNO: gno } = await getContracts()
    ST = ST || eth; BT = BT || gno

    const startingTimeOfAuction = (await dx.getAuctionStart.call(ST.address, BT.address)).toNumber()
    assert.equal(startingTimeOfAuction > 1, true, 'Auction hasn`t started yet')

    // wait for the right time to send buyOrder
    // implements isAtLeastZero (aka will not go BACK in time)
    await wait((startingTimeOfAuction - timestamp()))

    log(`
    time now ----------> ${new Date(timestamp() * 1000)}
    auction starts ----> ${new Date(startingTimeOfAuction * 1000)}
    `)

    assert.equal(timestamp() >= startingTimeOfAuction, true)
}
  

module.exports = {
    toWei,
    getContracts,
    setAndCheckAuctionStarted
}