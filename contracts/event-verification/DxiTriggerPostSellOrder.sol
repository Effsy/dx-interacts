// Copyright (c) 2016-2018 Clearmatics Technologies Ltd
// SPDX-License-Identifier: LGPL-3.0+
pragma solidity ^0.5.2;

import "../DxInteracts.sol";
import "./Verifier.sol";

contract EventEmitterVerifier {
    function verify(bytes20 _contractEmittedAddress, bytes memory _rlpReceipt) public returns (bool);
}

contract DxiTriggerPostSellOrder {

    EventEmitterVerifier eventVerifier;
    DxInteracts dxInteracts;

    constructor(address _dxiAddress, address _verifierAddr) public {
        eventVerifier = EventEmitterVerifier(_verifierAddr);
        dxInteracts = DxInteracts(_dxiAddress);
    }

    function verifyAndExecute(
        bytes memory _proof,
        bytes memory _blockHeader,
        address _sellToken,
        address _buyToken,
        uint _auctionIndex,
        uint _amount
    ) public {
        bytes memory receipt = Verifier.CheckProofs(_proof, _blockHeader);

        //require(verifier.verify(_contractEmittedAddress, receipt), "Event verification failed.");
        dxInteracts.postSellOrder(_sellToken, _buyToken, _auctionIndex, _amount);
    }

}