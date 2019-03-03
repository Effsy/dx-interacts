pragma solidity ^0.5.2;

import "./DxInterface.sol";
import "./Weth.sol";

contract dxInteracts is DxInterface {

    WETH public ethToken;

    constructor(address _dx, address _ethToken) DxInterface(_dx) public {
        require(_ethToken != address(0), "The WETH address must be valid");
        ethToken = WETH(_ethToken);
    }

    function sellEther(address buyToken) external payable  {
        ethToken.deposit.value(msg.value)();
        ethToken.approve(address(dx), msg.value);
        DxInterface.depositAndSell(address(ethToken), buyToken, msg.value);
    }
}