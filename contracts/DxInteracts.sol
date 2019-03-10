pragma solidity ^0.5.2;

import "@gnosis.pm/dx-contracts/contracts/DutchExchange.sol";
import "@gnosis.pm/util-contracts/contracts/EtherToken.sol";
import "@gnosis.pm/util-contracts/contracts/Token.sol";


contract DxInteracts {

    DutchExchange public dx;
    EtherToken public ethToken;

    constructor(address _dx, address _ethToken) public {
        require(_ethToken != address(0), "The WETH address must be valid");
        require(address(_dx) != address(0), "DutchExchange can't have address 0");

        dx = DutchExchange(_dx); 
        ethToken = EtherToken(_ethToken);
    }

    function sellEther(address buyToken) 
        external
        payable
        // returns (bool)
        returns (uint newBal, uint auctionIndex, uint newSellerBal)
    {
        ethToken.deposit.value(msg.value)();
        require(ethToken.approve(address(dx), msg.value), "fail to approve eth token");
        // Refactor: make depositToken internal and call it from here
        return dx.depositAndSell(address(ethToken), buyToken, msg.value);
    }

    function depositToken(address _token, uint _amount)
        external
        returns (uint)
    {
        Token(_token).approve(address(dx), _amount);
        return dx.deposit(_token, _amount);
    }

    function depositEther()
        external
        payable
    {
        ethToken.deposit.value(msg.value)();
        ethToken.approve(address(dx), msg.value);
        dx.deposit(address(ethToken), msg.value);
    }

    function depositAndSell(address sellToken, address buyToken, uint _amount)
        external
        returns (uint newBal, uint auctionIndex, uint newSellerBal)
    {
        // allowance must have been set on the sell token
        // check dx's SafeTransfer.sol
        Token(sellToken).approve(address(dx), _amount);
        return dx.depositAndSell(sellToken, buyToken, _amount);
    }

    function postSellOrder(address sellToken, address buyToken, uint auctionIndex, uint amount)
        external
        returns (uint, uint)
    {
        return dx.postSellOrder(sellToken, buyToken, auctionIndex, amount);
    }

    function claimAuction(address sellToken, address buyToken, address user, uint auctionIndex, uint amount) 
        external
        returns (uint returned, uint frtsIssued, uint newBal)
    {
        (returned, frtsIssued, newBal) = dx.claimAndWithdraw(sellToken, buyToken, user, auctionIndex, amount);
        Token(buyToken).transfer(user, amount);
        return (returned, frtsIssued, newBal);
    }

    function addTokenPair(
        address token1,
        address token2,
        uint token1Funding,
        uint token2Funding,
        uint initialClosingPriceNum,
        uint initialClosingPriceDen
    )
        external
    {
        dx.addTokenPair(
            token1, 
            token2, 
            token1Funding, 
            token2Funding, 
            initialClosingPriceNum, 
            initialClosingPriceDen
        );
    }
}