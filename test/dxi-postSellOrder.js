const dxInteracts = artifacts.require("DxInteracts");
const { getContracts, setupTest, wait } = require("testFunctions");

contract("dxInteracts", async accounts => {

    const startBal = {
        startingETH: 0,
        startingGNO: 90.0.toWei().toString(),
        // TODO: find clean solution. 
        // ether.js has its own bn implementation
        // 100 times smaller than usual price, reduced to surpress bignumber parse error
        ethUSDPrice: 11.0.toWei().toString(),
        sellingAmount: 50.0.toWei().toString()
    }
    
    before(
        async () => {
            contracts = await getContracts();
            // destructure contracts into easy to use aliases
            ({
                EtherToken: eth,
                TokenGNO: gno,
                TokenFRT: mgn,
                DutchExchange: dx
            } = contracts)

            await setupTest(accounts, contracts, startBal)
        }
    );

    it("should post sell order on dutchExchange", async () => {
        let dxi = await dxInteracts.deployed();

        // TODO: read from dx contract
        let sellOrderPostEventEmitted = false
        assert.equal(sellOrderPostEventEmitted, true);
    });
});