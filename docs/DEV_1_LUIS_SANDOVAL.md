# 🛡️ AltiPay Protocol — Guía Maestra de Ingeniería: DESARROLLADOR 1
## 🧑‍💻 Luis Sandoval — Smart Contracts & Blockchain Protocol Engineer

> **Versión:** 1.0.0 — Hackathon Edition  
> **Estado:** Documento de Especificación y Ejecución Directa  
> **Responsable:** **Luis Sandoval (DEV 1)**  
> **Bounties bajo su custodia:** **Avalanche Fuji (Snowtrace)** · **HSK Chain Testnet (HashKey)**  
> **Dependencias directas:** Entrega ABIs y direcciones a Jorge Ayala (DEV 2) y fondos/cuentas a Joseca (DEV 4) y Eddy Galvan (DEV 3).

---

## 🧭 1. Delimitación Estricta de Funciones (Zero-Overlap)

Para que tu trabajo **no choque ni se solape** con el de los otros 3 desarrolladores, tus límites de responsabilidad están definidos de forma quirúrgica:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        FRONTERAS DE RESPONSABILIDAD (ZERO CLASH)                       │
│                                                                                        │
│  ✅ TU DOMINIO EXCLUSIVO (Luis Sandoval - DEV 1):                                      │
│     • Toda la lógica on-chain en Solidity (^0.8.20).                                   │
│     • Toolchain de compilación, testing y scripts (Foundry / Hardhat).                 │
│     • Despliegue y verificación en Avalanche Fuji y HSK Testnet.                       │
│     • Optimización de gas, seguridad STRIDE y prevención de reentrancy.                │
│     • Generación y exportación de ABIs y direcciones hacia el frontend.                │
│                                                                                        │
│  ❌ NO TOCAS (En manos de Jorge Ayala - DEV 2):                                        │
│     • Configuración de Wagmi / Viem en Next.js.                                        │
│     • SDKs de Frontend (@pollar/react y @unlock-protocol/react).                       │
│     • Hooks de React y manejo de transacciones en la interfaz.                         │
│                                                                                        │
│  ❌ NO TOCAS (En manos de Eddy Galvan - DEV 3):                                        │
│     • Tailwind CSS, estilos, componentes visuales de UI o Landing Page.                │
│     • Formulario de creación de orden del comprador y teclado PIN táctil.              │
│                                                                                        │
│  ❌ NO TOCAS (En manos de Joseca - DEV 4):                                             │
│     • Dashboard del vendedor, subida de foto de guía y APIs off-chain.                 │
│     • Video pitch de Vaquita, slides de presentación y entrega en Devfolio.            │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 2. Estructura de Archivos a Crear y Mantener

Trabajarás exclusivamente dentro de la carpeta de contratos y scripts (ej. `packages/hardhat/` o la raíz de contratos del proyecto):

```
contracts/
├── AltiPayEscrow.sol            # [CORE] Contrato principal de custodia condicional
├── MockUSDC.sol                 # [TESTNET] Token ERC-20 con faucet libre (6 decimales)
└── interfaces/
    ├── IAltiPayEscrow.sol       # Interfaz pública del protocolo
    └── IUnlockLock.sol          # Interfaz para verificar VIP Key de Unlock Protocol

test/
├── AltiPayEscrow.t.sol          # Suite de tests unitarios (Happy path, revert, fees)
└── AltiPayEscrow.security.t.sol # Tests de seguridad (Reentrancy, expiración, accesos)

scripts/
├── deploy-mock-usdc.ts          # Script para desplegar MockUSDC en Fuji y HSK
├── deploy-escrow.ts             # Script de despliegue de AltiPayEscrow
├── verify.ts                    # Script de verificación en Snowtrace y HSK Explorer
└── export-artifacts.ts          # SCRIPT CRÍTICO: Exporta ABIs y direcciones a DEV 2

hardhat.config.ts / foundry.toml # Configuración multi-chain de redes y RPCs
.env.example                     # Variables privadas del deployer
```

---

## 📜 3. Especificación Técnica de los Smart Contracts

### 3.1 `contracts/interfaces/IUnlockLock.sol`
Interfaz mínima para consultar membresías VIP del **Bounty Unlock Protocol**:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IUnlockLock {
    /// @notice Retorna true si el usuario posee un NFT llave válido y activo
    function getHasValidKey(address _user) external view returns (bool);
}
```

---

### 3.2 `contracts/AltiPayEscrow.sol` (Código de Producción)
Implementa el motor de custodia con protección CEI (*Checks-Effects-Interactions*), seguridad OpenZeppelin y descuento para miembros VIP.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IUnlockLock.sol";

/**
 * @title AltiPayEscrow
 * @notice Protocolo no custodial de custodia comercial condicional atada a encomiendas.
 * @author Luis Sandoval (DEV 1) - AltiPay Team
 */
contract AltiPayEscrow is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // ── Constantes y Configuración ──
    uint256 public constant BASE_FEE_BPS = 50; // 0.50% (50 puntos básicos)
    uint256 public constant BPS_DIVISOR = 10000;
    
    address public feeRecipient;
    IUnlockLock public vipLock; // Contrato Unlock Protocol para 0% fee

    // ── Estados de la Orden ──
    enum OrderStatus {
        NONE,        // 0: Inexistente
        FUNDED,      // 1: Fondos custodiados, en espera de despacho
        DISPATCHED,  // 2: Despachado por el vendedor con número de guía
        COMPLETED,   // 3: Entregado exitosamente (fondos liquidados)
        REFUNDED,    // 4: Reembolsado al comprador tras vencimiento
        CANCELLED    // 5: Cancelado antes del despacho
    }

    // ── Estructura de la Orden ──
    struct Order {
        address buyer;
        address seller;
        address token;
        uint256 amount;
        bytes32 secretHash;
        uint256 deadline;
        OrderStatus status;
        string description;
        string trackingInfo;
        uint256 createdAt;
        uint256 completedAt;
    }

    // ── Storage ──
    mapping(bytes32 => Order) public orders;
    mapping(address => bytes32[]) public userOrderIds;
    uint256 public orderCount;

    // ── Eventos ──
    event OrderCreated(
        bytes32 indexed orderId,
        address indexed buyer,
        address indexed seller,
        address token,
        uint256 amount,
        bytes32 secretHash,
        uint256 deadline,
        string description
    );

    event OrderDispatched(
        bytes32 indexed orderId,
        address indexed seller,
        string trackingInfo
    );

    event OrderCompleted(
        bytes32 indexed orderId,
        address indexed seller,
        uint256 netAmount,
        uint256 feePaid,
        uint256 completedAt
    );

    event OrderRefunded(
        bytes32 indexed orderId,
        address indexed buyer,
        uint256 amount,
        uint256 refundedAt
    );

    event OrderCancelled(
        bytes32 indexed orderId,
        address indexed buyer,
        uint256 amount
    );

    event VIPLockUpdated(address indexed newLock);
    event FeeRecipientUpdated(address indexed newRecipient);

    // ── Constructor ──
    constructor(address _feeRecipient, address _vipLock) Ownable(msg.sender) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
        vipLock = IUnlockLock(_vipLock);
    }

    // ── Funciones Principales de Negocio ──

    /**
     * @notice Crea y fondea una nueva orden de custodia bloqueando los tokens.
     */
    function createOrder(
        address _seller,
        address _token,
        uint256 _amount,
        bytes32 _secretHash,
        uint256 _deadline,
        string calldata _description
    ) external nonReentrant returns (bytes32 orderId) {
        // Checks
        require(_seller != address(0), "Invalid seller address");
        require(_seller != msg.sender, "Buyer cannot be seller");
        require(_token != address(0), "Invalid token address");
        require(_amount > 0, "Amount must be > 0");
        require(_deadline > block.timestamp + 1 hours, "Deadline must be at least 1h in future");
        require(_secretHash != bytes32(0), "Secret hash cannot be zero");

        // Generación de ID determinístico único
        orderCount++;
        orderId = keccak256(abi.encodePacked(
            msg.sender,
            _seller,
            _amount,
            _secretHash,
            orderCount,
            block.chainid
        ));
        require(orders[orderId].status == OrderStatus.NONE, "Order ID collision");

        // Effects
        orders[orderId] = Order({
            buyer: msg.sender,
            seller: _seller,
            token: _token,
            amount: _amount,
            secretHash: _secretHash,
            deadline: _deadline,
            status: OrderStatus.FUNDED,
            description: _description,
            trackingInfo: "",
            createdAt: block.timestamp,
            completedAt: 0
        });

        userOrderIds[msg.sender].push(orderId);
        userOrderIds[_seller].push(orderId);

        // Interactions (CEI)
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        emit OrderCreated(
            orderId,
            msg.sender,
            _seller,
            _token,
            _amount,
            _secretHash,
            _deadline,
            _description
        );
    }

    /**
     * @notice El vendedor confirma el despacho de mercadería y registra la guía.
     */
    function confirmDispatch(
        bytes32 _orderId,
        string calldata _trackingInfo
    ) external {
        Order storage order = orders[_orderId];

        // Checks
        require(order.status == OrderStatus.FUNDED, "Order not in FUNDED state");
        require(order.seller == msg.sender, "Only seller can dispatch");
        require(bytes(_trackingInfo).length > 0, "Tracking info required");

        // Effects
        order.status = OrderStatus.DISPATCHED;
        order.trackingInfo = _trackingInfo;

        emit OrderDispatched(_orderId, msg.sender, _trackingInfo);
    }

    /**
     * @notice El comprador libera los fondos ingresando el código secreto correcto.
     */
    function confirmDeliveryWithSecret(
        bytes32 _orderId,
        bytes32 _secret
    ) external nonReentrant {
        Order storage order = orders[_orderId];

        // Checks
        require(
            order.status == OrderStatus.FUNDED || order.status == OrderStatus.DISPATCHED,
            "Order not eligible for delivery"
        );
        require(order.buyer == msg.sender, "Only buyer can release funds");
        require(
            keccak256(abi.encodePacked(_secret)) == order.secretHash,
            "Invalid secret code"
        );

        // Effects
        order.status = OrderStatus.COMPLETED;
        order.completedAt = block.timestamp;

        // Cálculo de comisión con beneficio VIP de Unlock Protocol
        uint256 fee = 0;
        bool isVIP = false;
        if (address(vipLock) != address(0)) {
            try vipLock.getHasValidKey(order.buyer) returns (bool valid) {
                isVIP = valid;
            } catch {
                isVIP = false;
            }
        }

        if (!isVIP) {
            fee = (order.amount * BASE_FEE_BPS) / BPS_DIVISOR;
        }

        uint256 netAmount = order.amount - fee;

        // Interactions (CEI)
        if (fee > 0 && feeRecipient != address(0)) {
            IERC20(order.token).safeTransfer(feeRecipient, fee);
        }
        IERC20(order.token).safeTransfer(order.seller, netAmount);

        emit OrderCompleted(_orderId, order.seller, netAmount, fee, block.timestamp);
    }

    /**
     * @notice Reclamo unilateral de reembolso si expira el plazo sin entrega.
     */
    function claimRefund(bytes32 _orderId) external nonReentrant {
        Order storage order = orders[_orderId];

        // Checks
        require(
            order.status == OrderStatus.FUNDED || order.status == OrderStatus.DISPATCHED,
            "Order not refundable"
        );
        require(order.buyer == msg.sender, "Only buyer can claim refund");
        require(block.timestamp > order.deadline, "Deadline has not passed yet");

        // Effects
        order.status = OrderStatus.REFUNDED;
        order.completedAt = block.timestamp;

        // Interactions (CEI)
        IERC20(order.token).safeTransfer(order.buyer, order.amount);

        emit OrderRefunded(_orderId, msg.sender, order.amount, block.timestamp);
    }

    /**
     * @notice Cancela la orden antes de que el vendedor la despache.
     */
    function cancelOrder(bytes32 _orderId) external nonReentrant {
        Order storage order = orders[_orderId];

        // Checks
        require(order.status == OrderStatus.FUNDED, "Cannot cancel after dispatch");
        require(order.buyer == msg.sender, "Only buyer can cancel");

        // Effects
        order.status = OrderStatus.CANCELLED;
        order.completedAt = block.timestamp;

        // Interactions (CEI)
        IERC20(order.token).safeTransfer(order.buyer, order.amount);

        emit OrderCancelled(_orderId, msg.sender, order.amount);
    }

    // ── Funciones de Lectura (View) para el Frontend ──

    function getOrder(bytes32 _orderId) external view returns (Order memory) {
        return orders[_orderId];
    }

    function getUserOrders(address _user) external view returns (bytes32[] memory) {
        return userOrderIds[_user];
    }

    function getUserOrderCount(address _user) external view returns (uint256) {
        return userOrderIds[_user].length;
    }

    // ── Administración ──

    function setVIPLock(address _newLock) external onlyOwner {
        vipLock = IUnlockLock(_newLock);
        emit VIPLockUpdated(_newLock);
    }

    function setFeeRecipient(address _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "Zero address");
        feeRecipient = _newRecipient;
        emit FeeRecipientUpdated(_newRecipient);
    }
}
```

---

### 3.3 `contracts/MockUSDC.sol` (Para Pruebas en Testnet)
Para que los otros desarrolladores (Jorge, Eddy y Joseca) puedan operar libremente en **Avalanche Fuji** y **HSK Testnet** sin depender de grifos lentos:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    uint8 private constant DECIMALS = 6;

    constructor() ERC20("USD Coin Mock", "USDC") {
        // Mint inicial al creador: 1,000,000 USDC
        _mint(msg.sender, 1_000_000 * 10**DECIMALS);
    }

    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /// @notice Faucet público ilimitado para pruebas del equipo
    function faucet(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
```

---

## 🧪 4. Suite de Pruebas Automatizadas (`test/AltiPayEscrow.t.sol`)

Debes garantizar una cobertura superior al 95%. Ejecuta `forge test -vvv` o `npx hardhat test`:

### Casos de Prueba Críticos a Validar:
1. **Happy Path:**
   * Comprador deposita 150 USDC con hash secreto `keccak256("PIN_123456")`.
   * Contrato deduce fondos del comprador y cambia a `FUNDED`.
   * Vendedor ejecuta `confirmDispatch` con `"Guia Flota Bolivar #48291"`. Estado pasa a `DISPATCHED`.
   * Comprador ejecuta `confirmDeliveryWithSecret` con `"PIN_123456"`.
   * Vendedor recibe fondos netos y `feeRecipient` recibe el 0.5%.
2. **Rechazo por Secreto Inválido:**
   * Comprador envía `"PIN_ERRONEO"`. Transacción revierte con `"Invalid secret code"`. Fondos permanecen intactos.
3. **Reclamo de Reembolso (Timeout):**
   * Se avanza el reloj con `vm.warp(block.timestamp + 73 hours)`.
   * Comprador llama a `claimRefund()`. Recibe el 100% de los fondos.
4. **Intento de Reembolso Prematuro:**
   * Comprador intenta llamar a `claimRefund()` antes del `deadline`. Revierte con `"Deadline has not passed yet"`.
5. **Ataque de Reentrancy:**
   * Probar que contratos atacantes maliciosos no pueden drenar el contrato en callbacks de transfer.
6. **Exención de Comisión Unlock VIP:**
   * Mockear `vipLock.getHasValidKey(buyer) == true`.
   * Comprobar que el vendedor recibe exactamente el 100% de los fondos sin descuento de fee.

---

## 🌐 5. Configuración Multi-Chain (`hardhat.config.ts`)

Configuración lista para los dos bounties principales:

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";
const SNOWTRACE_API_KEY = process.env.SNOWTRACE_API_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // 🔴 Bounty Avalanche (Fuji Testnet)
    avalancheFuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: [PRIVATE_KEY],
    },
    // 🟡 Bounty HSK Chain (Testnet)
    hskTestnet: {
      url: "https://testnet.hsk.xyz", // O el RPC oficial proveído en el hackathon
      chainId: 177,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      avalancheFuji: SNOWTRACE_API_KEY,
    },
  },
};

export default config;
```

---

## 🚀 6. Handoff Crítico: Cómo entregar a Jorge Ayala (DEV 2)

Para que **Jorge Ayala** pueda conectar el frontend sin retrasos, debes automatizar la exportación de contratos con este script:

### `scripts/export-artifacts.ts`
```typescript
import * as fs from "fs";
import * as path from "path";

async function main() {
  const escrowArtifact = require("../artifacts/contracts/AltiPayEscrow.sol/AltiPayEscrow.json");
  const usdcArtifact = require("../artifacts/contracts/MockUSDC.sol/MockUSDC.json");

  const contractsData = {
    43113: {
      name: "Avalanche Fuji",
      AltiPayEscrow: {
        address: process.env.ESCROW_FUJI_ADDRESS || "0x...",
        abi: escrowArtifact.abi,
      },
      MockUSDC: {
        address: process.env.USDC_FUJI_ADDRESS || "0x...",
        abi: usdcArtifact.abi,
      },
    },
    177: {
      name: "HSK Testnet",
      AltiPayEscrow: {
        address: process.env.ESCROW_HSK_ADDRESS || "0x...",
        abi: escrowArtifact.abi,
      },
      MockUSDC: {
        address: process.env.USDC_HSK_ADDRESS || "0x...",
        abi: usdcArtifact.abi,
      },
    },
  };

  const outputPath = path.join(__dirname, "../../frontend/contracts/deployedContracts.ts");
  const fileContent = `/* Auto-generated by Luis Sandoval (DEV 1) */\nexport const deployedContracts = ${JSON.stringify(contractsData, null, 2)} as const;\n`;

  fs.writeFileSync(outputPath, fileContent);
  console.log("✅ Contratos exportados exitosamente a frontend/contracts/deployedContracts.ts");
}

main().catch(console.error);
```

---

## 🏆 7. Checklist de Cumplimiento de Bounties para Luis Sandoval

* [ ] **Bounty Avalanche (Fuji Testnet):**
  * `AltiPayEscrow.sol` desplegado en Fuji (Chain ID `43113`).
  * Código fuente verificado en Snowtrace (verificación verde).
  * Enlace al contrato verificado guardado para el `README.md`.
* [ ] **Bounty HSK Chain:**
  * `AltiPayEscrow.sol` desplegado en HSK Testnet (Chain ID `177`).
  * Hash de transacción de una orden creada y liberada guardado para el jurado.
* [ ] **Gas Target:**
  * `createOrder`: < 150,000 gas.
  * `confirmDeliveryWithSecret`: < 80,000 gas.
* [ ] **Entrega de Fondos al Equipo:**
  * Mintear 10,000 MockUSDC a las wallets de Jorge (Dev 2), Eddy (Dev 3) y Joseca (Dev 4) para pruebas en Fuji y HSK.

---

> 💡 **Regla de Oro para Luis:** Tu entregable principal es un contrato **seguro, probado, desplegado y exportado**. Una vez que entregues `deployedContracts.ts` a Jorge Ayala, tu trabajo se enfoca en verificar contratos en los exploradores y monitorear transacciones de prueba. ¡A romperla en la blockchain! 🚀
