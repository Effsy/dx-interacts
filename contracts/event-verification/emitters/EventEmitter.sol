pragma solidity ^0.5.2;

contract EventEmitter {

    event EventOfInterest();

    function emitEvent() public {
        emit EventOfInterest();
    }

}

