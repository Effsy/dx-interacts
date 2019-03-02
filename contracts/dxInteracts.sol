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

    // TODO: Change function visibility to internal. Public in the meantime for debugging
    function postSellOrder(address sellToken, address buyToken, uint amount) public {
        dx.depositAndSell(sellToken, buyToken, amount);
    }
}