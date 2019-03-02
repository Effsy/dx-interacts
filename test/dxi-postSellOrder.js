const dxInteracts = artifacts.require("dxInteracts");

contract("dxInteracts", async accounts => {
    it("should post sell order on dutchExchange", async () => {
        let dxi = await dxInteracts.deployed();

        // TODO: read from dx contract
        let sellOrderPostEventEmitted = false
        assert.equal(sellOrderPostEventEmitted, true);
    });
});