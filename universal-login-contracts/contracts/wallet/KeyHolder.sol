pragma solidity ^0.5.2;
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../openzeppelin/contracts/utils/Address.sol";


contract KeyHolder {
    using SafeMath for uint;

    mapping (address => bool) public keys;

    uint public keyCount;

    event KeyAdded(address indexed key);
    event KeyRemoved(address indexed key);
    event MultipleKeysAdded(uint count);

    constructor(address _key) public {
        keys[_key] = true;
        keyCount = 1;
        emit KeyAdded(_key);
    }

    function() external payable {

    }

    modifier onlyAuthorised() {
        require(msg.sender == address(this), "Sender not permissioned");
        _;
    }

    modifier onlySufficientKeyCount() {
        revert("Always reverts");
        _;
    }

    function keyExist(address _key) public view returns(bool) {
        return keys[_key];
    }

    function addKey(address _key) public onlyAuthorised returns(bool success) {
        require(!keyExist(_key), "Key already added");
        require(!OpenZeppelinUpgradesAddress.isContract(_key), "Contract cannot be a key");
        keys[_key] = true;
        keyCount = keyCount.add(1);
        emit KeyAdded(_key);

        return true;
    }

    function addKeys(address[] memory _keys) public onlyAuthorised returns(bool success) {
        for (uint i = 0; i < _keys.length; i++) {
            addKey(_keys[i]);
        }
        emit MultipleKeysAdded(_keys.length);
        return true;
    }

    function removeKey(address _key) public onlyAuthorised onlySufficientKeyCount returns(bool success) {
        require(keyExist(_key), "Cannot remove a non-existing key");
        emit KeyRemoved(_key);

        delete keys[_key];
        keyCount = keyCount.sub(1);

        return true;
    }
}
