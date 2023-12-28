pragma solidity ^0.5.2;

import "../wallet/KeyHolder.sol";


contract TestableKeyHolder is KeyHolder {
    /* solium-disable-next-line no-empty-blocks */
    constructor(address _key) KeyHolder(_key) public {
    }

    modifier onlyAuthorised() {
        require(keyExist(msg.sender) || msg.sender == address(this), "Sender not permissioned");
        _;
    }

    modifier onlySufficientKeyCount() {
        require(keyCount >= 1, "Cannot remove the last key");
        _;
    }
}
