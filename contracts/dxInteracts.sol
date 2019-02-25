pragma solidity ^0.5.2;

import "@gnosis.pm/dx-contracts/contracts/DutchExchange.sol";

contract dxInteracts {
    DutchExchange public dx;

    constructor(address _dx) public {
        require(address(_dx) != address(0), "DutchExchange can't have address 0");
        dx = DutchExchange(_dx);    
    }

    // TODO: only owner
    function _updateDx(address _dx) public {
        require(address(_dx) != address(0), "DutchExchange can't have address 0");
        dx = DutchExchange(_dx);  
    }


    // 2. We create the function that uses DutchX as a price feed
    function getBalanceInUsd (address token) public view returns (uint, uint) {
        uint pricetNum;
        uint priceDen;
        // Get the price in ETH for a token
        (pricetNum, priceDen) = dx.getPriceOfTokenInLastAuction(token);

        // Get the price of ETH
        PriceOracleInterface priceOracle = PriceOracleInterface(dx.ethUSDOracle());
        uint etherUsdPrice = priceOracle.getUSDETHPrice();
        // uint etherUsdPrice = 400 ether;

        // Return the price in USD:
        //    balance * Price TOKEN-ETH * price ETH-USD
        uint balance = balances[token];
        return (balance * pricetNum * etherUsdPrice, priceDen);
    }
}