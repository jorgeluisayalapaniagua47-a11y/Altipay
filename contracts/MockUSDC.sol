// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @notice Token ERC-20 para pruebas de testnet en Avalanche Fuji y HSK Testnet.
 * @dev 6 decimales como el USDC nativo. Incluye función faucet para autoservicio.
 */
contract MockUSDC is ERC20 {
    uint8 private constant DECIMALS = 6;

    constructor() ERC20("USD Coin Mock", "USDC") {
        // Mint inicial al creador: 1,000,000 USDC
        _mint(msg.sender, 1_000_000 * 10**DECIMALS);
    }

    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /**
     * @notice Mintea tokens a cualquier dirección para facilitar pruebas de integración.
     * @param to Dirección destino de los tokens.
     * @param amount Cantidad en unidades mínimas (ej. 100 * 10^6 para 100 USDC).
     */
    function faucet(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
