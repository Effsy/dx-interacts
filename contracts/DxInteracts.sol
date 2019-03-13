pragma solidity ^0.5.2;

import "@gnosis.pm/dx-contracts/contracts/DutchExchange.sol";
import "@gnosis.pm/util-contracts/contracts/EtherToken.sol";
import "@gnosis.pm/util-contracts/contracts/Token.sol";


contract DxInteracts is DxMath {

    // Token => user => amount
    // balances stores a user's balance held by DxInteracts in the DutchX
    mapping(address => mapping(address => uint)) public balances;

    // Token => Token =>  auctionIndex => user => amount
    mapping(address => mapping(address => mapping(uint => mapping(address => uint)))) public sellerBalances;
    mapping(address => mapping(address => mapping(uint => mapping(address => uint)))) public buyerBalances;

    DutchExchange public dx;
    EtherToken public ethToken;

    constructor(address _dx, address _ethToken) public {
        require(_ethToken != address(0), "The WETH address must be valid");
        require(address(_dx) != address(0), "DutchExchange can't have address 0");

        dx = DutchExchange(_dx); 
        ethToken = EtherToken(_ethToken);
    }

    function sellEther(address buyToken) 
        public
        payable
        // returns (bool)
        returns (uint auctionIndex, uint newSellerBal)
    {
        ethToken.deposit.value(msg.value)();
        require(ethToken.approve(address(dx), msg.value), "fail to approve eth token");
        depositToken(address(ethToken), msg.value);
        return postSellOrder(address(ethToken), buyToken, 0, msg.value);
    }

    function depositToken(address _token, uint _amount)
        public
        returns (uint newBal)
    {
        Token(_token).approve(address(dx), _amount);
        newBal = dx.deposit(_token, _amount);
        balances[_token][msg.sender] = newBal;
    }

    function depositEther()
        public
        payable
        returns (uint newBal)
    {
        ethToken.deposit.value(msg.value)();
        ethToken.approve(address(dx), msg.value);
        newBal = depositToken(address(ethToken), msg.value);
    }

    function depositAndSell(address sellToken, address buyToken, uint _amount)
        public
        returns (uint auctionIndex, uint newSellerBal)
    {
        // check dx's SafeTransfer.sol
        Token(sellToken).approve(address(dx), _amount);
        // TODO: Assess calling dx depositAndSell to save gas from saving state changes to balances
        depositToken(sellToken, _amount);
        return postSellOrder(sellToken, buyToken, 0, _amount);
    }

    function postSellOrder(address sellToken, address buyToken, uint auctionIndex, uint amount)
        public
        returns (uint newSellerBal, uint postedAuctionIndex)
    {
        (newSellerBal, postedAuctionIndex) = dx.postSellOrder(sellToken, buyToken, auctionIndex, amount);
        balances[sellToken][msg.sender] = sub(balances[sellToken][msg.sender], amount);
        sellerBalances[sellToken][buyToken][auctionIndex][msg.sender] = newSellerBal;
    }

    function claimSellerFunds(address sellToken, address buyToken, address user, uint auctionIndex)
        public
        returns (uint returned, uint frtsIssued)
    {
        (returned, frtsIssued) = dx.claimSellerFunds(sellToken, buyToken, address(this), auctionIndex);
    }
    
    function withdraw(address tokenAddress, uint amount)
        public
        returns (uint newBal)
    {
        uint usersBalance = balances[tokenAddress][msg.sender];
        amount = min(amount, usersBalance);
        
        // TODO: Fix negative balances
        // require(amount > 0, "The amount must be greater than 0");

        newBal = dx.withdraw(tokenAddress, amount);
        balances[tokenAddress][msg.sender] = newBal;
        Token(tokenAddress).transfer(msg.sender, amount);
    }

    function claimAuction(address sellToken, address buyToken, address user, uint auctionIndex, uint amount) 
        public
        returns (uint returned, uint frtsIssued, uint newBal)
    {
        // TODO: Check if user can actually claim
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
        public
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