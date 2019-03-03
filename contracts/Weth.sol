pragma solidity ^0.5.2;

import "./ERC20.sol";

// ----------------------------------------------------------------------------
// ERC Token Standard #20 Interface
// https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md
// ----------------------------------------------------------------------------
contract WETH is ERC20 {
    function deposit() public payable;
}