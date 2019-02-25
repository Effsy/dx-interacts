pragma solidity ^0.5.2;

import "@gnosis.pm/dx-contracts/contracts/DutchExchange.sol";

contract dxInteracts {
    DutchExchange public dx;

    constructor(address _dx) public {
        require(address(_dx) != address(0), "DutchExchange can't have address 0");
        dx = DutchExchange(_dx);    
    }

    // TODO: only owner
    function updateDx(address _dx) public {
        require(address(_dx) != address(0), "DutchExchange can't have address 0");
        dx = DutchExchange(_dx);  
    }



}