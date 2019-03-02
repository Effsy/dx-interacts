const dxInteracts = artifacts.require("dxInteracts");
const { getContracts, setupTest, wait } = require("@gnosis.pm/dx-contracts/test/testFunctions")

contract("dxInteracts", async accounts => {

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
        }
    )

    it("should post sell order on dutchExchange", async () => {
        let dxi = await dxInteracts.deployed();

        // TODO: read from dx contract
        let sellOrderPostEventEmitted = false
        assert.equal(sellOrderPostEventEmitted, true);
    });
});