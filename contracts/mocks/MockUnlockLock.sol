// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IUnlockLock.sol";

/**
 * @title MockUnlockLock
 * @notice Mock del contrato Lock de Unlock Protocol para tests unitarios y simulación en testnet.
 */
contract MockUnlockLock is IUnlockLock {
    mapping(address => bool) private hasKey;

    function setHasValidKey(address _user, bool _hasKey) external {
        hasKey[_user] = _hasKey;
    }

    function getHasValidKey(address _user) external view override returns (bool) {
        return hasKey[_user];
    }
}
