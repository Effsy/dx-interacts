pragma solidity ^0.5.2;

import "./DxInterface.sol";


contract dxInteracts is DxInterface {
    constructor(address _dx) DxInterface(_dx) public {}
}