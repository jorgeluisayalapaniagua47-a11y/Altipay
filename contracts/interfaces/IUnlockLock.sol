// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IUnlockLock
 * @notice Interfaz para consultar membresías NFT ("AltiPay VIP Key") en Unlock Protocol.
 */
interface IUnlockLock {
    /// @notice Retorna true si el usuario posee una llave NFT activa y válida
    function getHasValidKey(address _user) external view returns (bool);
}
