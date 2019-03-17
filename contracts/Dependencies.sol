pragma solidity ^0.5.2;

// NOTE:
//  This file porpouse is just to make sure truffle compiles all of depending
//  contracts when we are in development.
// 
//  For other environments, we just use the compiled contracts from the NPM 
//  package
 
// See contract for more details:
//    https://github.com/gnosis/dx-contracts/blob/master/contracts/DxDevDependencies.sol

import "@gnosis.pm/dx-contracts/contracts/DxDevDependencies.sol";

contract Dependencies {}