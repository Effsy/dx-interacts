pragma solidity ^0.5.2;

import "@gnosis.pm/dx-contracts/contracts/DutchExchange.sol";

contract DxInterface {
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

    function depositAndSell(address sellToken, address buyToken, uint amount) 
        internal
        returns (uint newBal, uint auctionIndex, uint newSellerBal)
    {
        return dx.depositAndSell(sellToken, buyToken, amount);
    }

    function claimAndWithdraw(address sellToken, address buyToken, address user, uint auctionIndex, uint amount) 
        internal
        returns (uint returned, uint frtsIssued, uint newBal)
    {
        return dx.claimAndWithdraw(sellToken, buyToken, user, auctionIndex, amount);
    }
}