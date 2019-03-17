pragma solidity ^0.5.2;

import "@gnosis.pm/dx-contracts/contracts/DutchExchange.sol";
import "@gnosis.pm/util-contracts/contracts/EtherToken.sol";
import "@gnosis.pm/util-contracts/contracts/Token.sol";


contract DxInteracts is DxMath, SafeTransfer {

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
        external
        payable
        // returns (bool)
        returns (uint newBal, uint auctionIndex, uint newSellerBal)
    {
        ethToken.deposit.value(msg.value)();
        require(ethToken.approve(address(dx), msg.value), "fail to approve eth token");
        newBal = _depositToken(address(ethToken), msg.value, msg.sender);
        (auctionIndex, newSellerBal) = _postSellOrder(address(ethToken), buyToken, 0, msg.value, msg.sender);
    }

    function depositToken(address _token, uint _amount)
        external
        returns (uint newBal)
    {
        return _depositToken(_token, _amount, msg.sender);
    }

    function _depositToken(address _token, uint _amount, address user)
        internal
        returns (uint newBal)
    {
        Token(_token).approve(address(dx), _amount);
        newBal = dx.deposit(_token, _amount);
        balances[_token][user] = newBal;
    }

    function depositEther()
        external
        payable
        returns (uint newBal)
    {
        ethToken.deposit.value(msg.value)();
        ethToken.approve(address(dx), msg.value);
        newBal = _depositToken(address(ethToken), msg.value, msg.sender);
    }

    function depositAndSell(address sellToken, address buyToken, uint _amount)
        external
        returns (uint newBal, uint auctionIndex, uint newSellerBal)
    {
        // check dx's SafeTransfer.sol
        Token(sellToken).approve(address(dx), _amount);
        // TODO: Assess calling dx depositAndSell to save gas from saving state changes to balances
        newBal = _depositToken(sellToken, _amount, msg.sender);
        (auctionIndex, newSellerBal) = _postSellOrder(sellToken, buyToken, 0, _amount, msg.sender);
    }

    function postSellOrder(address sellToken, address buyToken, uint auctionIndex, uint amount)
        external
        returns (uint newSellerBal, uint postedAuctionIndex)
    {
        return _postSellOrder(sellToken, buyToken, auctionIndex, amount, msg.sender);
    }

    function _postSellOrder(address sellToken, address buyToken, uint auctionIndex, uint amount, address user)
        internal
        returns (uint newSellerBal, uint postedAuctionIndex)
    {
        (postedAuctionIndex, newSellerBal) = dx.postSellOrder(sellToken, buyToken, auctionIndex, amount);
        balances[sellToken][user] = sub(balances[sellToken][user], amount);
        sellerBalances[sellToken][buyToken][auctionIndex][user] = newSellerBal;
    }

    /// @dev anyone can claim the funds, manage balance only when user wants to withdraw
    function _claimSellerFunds(address sellToken, address buyToken, uint auctionIndex, address user)
        internal
        returns (uint returned, uint frtsIssued)
    {
        // Token => Token =>  auctionIndex => user => amount
        sellerBalances[sellToken][buyToken][auctionIndex][user] = 0;
        (returned, frtsIssued) = dx.claimSellerFunds(sellToken, buyToken, address(this), auctionIndex);
        balances[buyToken][user] = add(balances[buyToken][user], returned);
    }

    /// @dev anyone can claim the funds, manage balance only when user wants to withdraw
    function claimSellerFunds(address sellToken, address buyToken, uint auctionIndex)
        external
        returns (uint returned, uint frtsIssued)
    {
        return _claimSellerFunds(sellToken, buyToken, auctionIndex, msg.sender);
    }
    
    function withdraw(address tokenAddress, uint amount) 
        external
        returns (uint newBal)
    {
        return _withdraw(tokenAddress, amount, msg.sender);
    }
    
    function _withdraw(address tokenAddress, uint amount, address user)
        internal
        returns (uint newBal)
    {
        // TODO: update the seller/buyer balance in case someone else triggered the claim instead of dxi
        uint usersBalance = balances[tokenAddress][user];
        
        require(amount <= usersBalance, "The user balance must be greater than the amount");

        newBal = dx.withdraw(tokenAddress, amount);
        balances[tokenAddress][user] = newBal;

        require(safeTransfer(tokenAddress, user, amount, false), "The withdraw transfer must succeed");
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