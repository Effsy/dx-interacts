pragma solidity ^0.5.2;

import "./DxInterface.sol";
import "@gnosis.pm/util-contracts/contracts/EtherToken.sol";
import "@gnosis.pm/util-contracts/contracts/Token.sol";

contract dxInteracts is DxInterface {

    EtherToken public ethToken;

    constructor(address _dx, address _ethToken) DxInterface(_dx) public {
        require(_ethToken != address(0), "The WETH address must be valid");
        ethToken = EtherToken(_ethToken);
    }

    function sellEther(address buyToken) 
        external 
        payable
        returns (uint newBal, uint auctionIndex, uint newSellerBal)
    {
        ethToken.deposit.value(msg.value)();
        ethToken.approve(address(dx), msg.value);
        return DxInterface.depositAndSell(address(ethToken), buyToken, msg.value);
    }

    function claimAuction(address sellToken, address buyToken, address user, uint auctionIndex, uint amount) 
        external
        returns (uint returned, uint frtsIssued, uint newBal)
    {
        (returned, frtsIssued, newBal) = DxInterface.claimAndWithdraw(sellToken, buyToken, user, auctionIndex, amount);
        Token(buyToken).transfer(user, amount);
        return (returned, frtsIssued, newBal);
    }
}