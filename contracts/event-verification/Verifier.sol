pragma solidity ^0.5.2;
import "./libraries/RLP.sol";
import "./libraries/PatriciaTrie.sol";

library Verifier {
    using RLP for RLP.RLPItem;
    using RLP for bytes;

    struct BlockHeader {
        bytes32 hash;
        bytes32 receiptsRoot;
        uint number;
    }

    function CheckProofs(bytes memory _proof, bytes memory _blockHeader) internal returns (bytes memory){
        RLP.RLPItem[] memory proof = _proof.toRLPItem().toList();

        //require(proof.length == 5, "Malformed proof");

        // BlockHeader memory blockHeader = decodeBlockHeader(_blockHeader);
            
        // bytes32 validBlockHash = blockhash(blockHeader.number);
        // bytes32 givenBlockHash = keccak256(_blockHeader);
    
        // require(validBlockHash == givenBlockHash, "invalid block hash");

        // Verify receipt is in receipt's trie using receipts root from the validated block header
        //verifyProof(proof[3].toBytes(), proof[4].toBytes(), proof[0].toBytes(), blockHeader.receiptsRoot);

        return proof[3].toBytes();
    }

    function decodeBlockHeader(bytes memory _blockHeader) private pure returns (BlockHeader memory header) {
        RLP.RLPItem memory headerItem = RLP.toRLPItem(_blockHeader);
        RLP.RLPItem[] memory headerList = RLP.toList(headerItem);

        bytes32 hash = keccak256(_blockHeader);
        bytes32 receiptHash = RLP.toBytes32(headerList[5]);
        uint number = RLP.toUint(headerList[8]);

        header = BlockHeader(hash, receiptHash, number);
    }

    function verifyProof(bytes memory _value, bytes memory _parentNodes, bytes memory _path, bytes32 _hash) private {
        assert(PatriciaTrie.verifyProof(_value, _parentNodes, _path, _hash));
    }
}
