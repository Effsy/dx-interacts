pragma solidity ^0.5.2;

import "./DxInterface.sol";
import "./Weth.sol";
import "./ERC20.sol";

contract dxInteracts is DxInterface {

    WETH public ethToken;

    constructor(address _dx, address _ethToken) DxInterface(_dx) public {
        require(_ethToken != address(0), "The WETH address must be valid");
        ethToken = WETH(_ethToken);
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
        (returned, frtsIssued, newBal) = claimAndWithdraw(sellToken, buyToken, user, auctionIndex, amount);
        ERC20(buyToken).transfer(user, amount);
    }
}