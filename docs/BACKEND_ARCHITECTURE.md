# AltiPay Protocol — Arquitectura Backend (Smart Contracts + Infraestructura)

> **Versión:** 1.0.0  
> **Estado:** Especificación MVP  
> **Fecha:** 2026-09-11  

---

## 1. Visión General de la Arquitectura

AltiPay es un protocolo **backend-less** por diseño. La lógica de negocio, persistencia de datos y ejecución de transacciones reside enteramente en la blockchain. No existe un servidor centralizado.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ARQUITECTURA BACKEND ALTIPAY                     │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                      CAPA DE CONTRATOS (On-Chain)                 │  │
│  │                                                                    │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │  │
│  │  │   AltiPayEscrow  │  │   MockUSDC       │  │  IERC20        │  │  │
│  │  │   (Core Logic)   │  │   (Testnet only) │  │  (Interface)   │  │  │
│  │  │                  │  │                  │  │                │  │  │
│  │  │  • createOrder() │  │  • mint()        │  │  • transfer()  │  │  │
│  │  │  • confirmDis..()│  │  • approve()     │  │  • approve()   │  │  │
│  │  │  • confirmDel..()│  │  • balanceOf()   │  │  • balanceOf() │  │  │
│  │  │  • claimRefund() │  │                  │  │                │  │  │
│  │  │  • cancelOrder() │  │                  │  │                │  │  │
│  │  │  • getOrder()    │  │                  │  │                │  │  │
│  │  └──────────────────┘  └──────────────────┘  └────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                    │                                    │
│                              Despliegue                                 │
│                                    │                                    │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                     REDES BLOCKCHAIN (EVM)                        │  │
│  │                                                                    │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐    │  │
│  │  │  Avalanche   │  │    HSK       │  │  Pollar Mainnet      │    │  │
│  │  │  Fuji        │  │  Testnet     │  │  (Bounty Integration)│    │  │
│  │  │  (43113)     │  │  (177)       │  │                      │    │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                    │                                    │
│                              Indexación                                 │
│                                    │                                    │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    CAPA DE INDEXACIÓN (Opcional)                   │  │
│  │                                                                    │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐    │  │
│  │  │  The Graph   │  │  Ethers.js   │  │  RPC Direct          │    │  │
│  │  │  (Subgraph)  │  │  (Event      │  │  (getOrder calls)    │    │  │
│  │  │  Post-MVP    │  │   Listeners) │  │  MVP                 │    │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                  TOOLCHAIN DE DESARROLLO                          │  │
│  │                                                                    │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │  │
│  │  │ Foundry/ │  │ Solidity │  │ OpenZep  │  │ Unlock Protocol  │  │  │
│  │  │ Hardhat  │  │ ^0.8.20  │  │ Contracts│  │ (VIP Lock ERC721)│  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Contrato Principal: AltiPayEscrow

### 2.1 Especificación de Interfaz e Integración Unlock Protocol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Interfaz para validación de membresía VIP con Unlock Protocol
interface IUnlockLock {
    function getHasValidKey(address _user) external view returns (bool);
}

contract AltiPayEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Dirección del contrato Lock de Unlock Protocol ("AltiPay VIP Key")
    IUnlockLock public vipLock;
    address public feeRecipient;
    uint256 public constant BASE_FEE_BPS = 50; // 0.5% (50 basis points)

    // ──── Enums ────
    enum OrderStatus {
        NONE,        // 0
        FUNDED,      // 1
        DISPATCHED,  // 2
        COMPLETED,   // 3
        REFUNDED,    // 4
        CANCELLED    // 5
    }

    // ──── Structs ────
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

    // ──── State ────
    mapping(bytes32 => Order) public orders;
    uint256 public orderCount;
    mapping(address => bytes32[]) public userOrderIds;

    // ──── Events ────
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
        uint256 amount,
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
}
```

### 2.2 Funciones Principales

#### `createOrder()`

```solidity
function createOrder(
    address _seller,
    address _token,
    uint256 _amount,
    bytes32 _secretHash,
    uint256 _deadline,
    string calldata _description
) external nonReentrant returns (bytes32 orderId) {
    // ── Checks ──
    require(_seller != address(0), "Invalid seller");
    require(_seller != msg.sender, "Buyer cannot be seller");
    require(_amount > 0, "Amount must be > 0");
    require(_deadline > block.timestamp, "Deadline must be in the future");
    require(_secretHash != bytes32(0), "Invalid secret hash");

    // ── Generate unique orderId ──
    orderCount++;
    orderId = keccak256(abi.encodePacked(
        msg.sender,
        _seller,
        _amount,
        _secretHash,
        orderCount,
        block.chainid
    ));
    require(orders[orderId].status == OrderStatus.NONE, "Order already exists");

    // ── Effects ──
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

    // ── Interactions ──
    IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

    emit OrderCreated(
        orderId, msg.sender, _seller, _token,
        _amount, _secretHash, _deadline, _description
    );
}
```

#### `confirmDispatch()`

```solidity
function confirmDispatch(
    bytes32 _orderId,
    string calldata _trackingInfo
) external {
    Order storage order = orders[_orderId];

    // ── Checks ──
    require(order.status == OrderStatus.FUNDED, "Order not funded");
    require(order.seller == msg.sender, "Only seller can dispatch");

    // ── Effects ──
    order.status = OrderStatus.DISPATCHED;
    order.trackingInfo = _trackingInfo;

    emit OrderDispatched(_orderId, msg.sender, _trackingInfo);
}
```

#### `confirmDelivery()`

```solidity
function confirmDelivery(
    bytes32 _orderId,
    bytes32 _secret
) external nonReentrant {
    Order storage order = orders[_orderId];

    // ── Checks ──
    require(
        order.status == OrderStatus.FUNDED ||
        order.status == OrderStatus.DISPATCHED,
        "Order not in valid state"
    );
    require(order.buyer == msg.sender, "Only buyer can confirm");
    require(
        keccak256(abi.encodePacked(_secret)) == order.secretHash,
        "Invalid secret"
    );

    // ── Effects ──
    order.status = OrderStatus.COMPLETED;
    order.completedAt = block.timestamp;

    // ── Interactions ──
    IERC20(order.token).safeTransfer(order.seller, order.amount);

    emit OrderCompleted(_orderId, order.seller, order.amount, block.timestamp);
}
```

#### `claimRefund()`

```solidity
function claimRefund(bytes32 _orderId) external nonReentrant {
    Order storage order = orders[_orderId];

    // ── Checks ──
    require(
        order.status == OrderStatus.FUNDED ||
        order.status == OrderStatus.DISPATCHED,
        "Order not in valid state"
    );
    require(order.buyer == msg.sender, "Only buyer can refund");
    require(block.timestamp > order.deadline, "Deadline not reached");

    // ── Effects ──
    order.status = OrderStatus.REFUNDED;
    order.completedAt = block.timestamp;

    // ── Interactions ──
    IERC20(order.token).safeTransfer(order.buyer, order.amount);

    emit OrderRefunded(_orderId, msg.sender, order.amount, block.timestamp);
}
```

#### `cancelOrder()`

```solidity
function cancelOrder(bytes32 _orderId) external nonReentrant {
    Order storage order = orders[_orderId];

    // ── Checks ──
    require(order.status == OrderStatus.FUNDED, "Can only cancel funded orders");
    require(order.buyer == msg.sender, "Only buyer can cancel");

    // ── Effects ──
    order.status = OrderStatus.CANCELLED;
    order.completedAt = block.timestamp;

    // ── Interactions ──
    IERC20(order.token).safeTransfer(order.buyer, order.amount);

    emit OrderCancelled(_orderId, msg.sender, order.amount);
}
```

#### Funciones de Lectura (View)

```solidity
function getOrder(bytes32 _orderId) external view returns (Order memory) {
    return orders[_orderId];
}

function getUserOrders(address _user) external view returns (bytes32[] memory) {
    return userOrderIds[_user];
}

function getUserOrderCount(address _user) external view returns (uint256) {
    return userOrderIds[_user].length;
}
```

---

## 3. Contrato Auxiliar: MockUSDC (Solo Testnet)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    uint8 private _decimals = 6;

    constructor() ERC20("Mock USDC", "USDC") {}

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /// @notice Faucet público para testnet — cualquiera puede mintear
    function faucet(uint256 amount) external {
        _mint(msg.sender, amount);
    }

    /// @notice Mint directo (para scripts de deploy)
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
```

---

## 4. Estructura del Proyecto (Hardhat)

```
contracts/
├── AltiPayEscrow.sol          # Contrato principal de custodia
├── MockUSDC.sol               # Token mock para testnet
├── interfaces/
│   └── IAltiPayEscrow.sol     # Interfaz del contrato
└── libraries/
    └── OrderLib.sol            # Utilidades de orden (si se necesitan)

scripts/
├── deploy.ts                   # Script de despliegue multi-chain
├── deploy-mock-usdc.ts         # Despliegue del mock USDC
├── verify.ts                   # Verificación en exploradores
└── seed.ts                     # Datos de prueba para demo

test/
├── AltiPayEscrow.test.ts       # Tests unitarios completos
├── AltiPayEscrow.security.ts   # Tests de seguridad
└── helpers/
    ├── fixtures.ts              # Fixtures de Hardhat
    └── constants.ts             # Constantes de test

hardhat.config.ts               # Configuración multi-chain
.env                            # Variables de entorno (privadas)
.env.example                    # Template de variables
```

---

## 5. Configuración Hardhat (Multi-Chain)

```typescript
// hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "0x0000...";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },

  networks: {
    // ── Avalanche Fuji Testnet ──
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: [PRIVATE_KEY],
      gasPrice: 25000000000, // 25 gwei
    },

    // ── HSK Testnet ──
    hskTestnet: {
      url: process.env.HSK_TESTNET_RPC || "https://testnet-rpc.hsk.xyz",
      chainId: Number(process.env.HSK_CHAIN_ID) || 177,
      accounts: [PRIVATE_KEY],
    },

    // ── Local (Hardhat) ──
    hardhat: {
      chainId: 31337,
    },
  },

  etherscan: {
    apiKey: {
      avalancheFujiTestnet: process.env.SNOWTRACE_API_KEY || "",
    },
    customChains: [
      {
        network: "hskTestnet",
        chainId: Number(process.env.HSK_CHAIN_ID) || 177,
        urls: {
          apiURL: "https://testnet-explorer.hsk.xyz/api",
          browserURL: "https://testnet-explorer.hsk.xyz",
        },
      },
    ],
  },

  gasReporter: {
    enabled: true,
    currency: "USD",
    token: "AVAX",
  },
};

export default config;
```

---

## 6. Script de Despliegue

```typescript
// scripts/deploy.ts
import { ethers, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying on ${network.name} with account: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);

  // ── 1. Deploy MockUSDC (solo testnet) ──
  let usdcAddress: string;

  if (network.name !== "mainnet") {
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();
    usdcAddress = await mockUSDC.getAddress();
    console.log(`MockUSDC deployed at: ${usdcAddress}`);

    // Mint tokens de prueba
    const mintAmount = ethers.parseUnits("10000", 6); // 10,000 USDC
    await mockUSDC.mint(deployer.address, mintAmount);
    console.log(`Minted ${ethers.formatUnits(mintAmount, 6)} USDC to deployer`);
  } else {
    usdcAddress = "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E"; // USDC on Avalanche
  }

  // ── 2. Deploy AltiPayEscrow ──
  const AltiPayEscrow = await ethers.getContractFactory("AltiPayEscrow");
  const escrow = await AltiPayEscrow.deploy();
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log(`AltiPayEscrow deployed at: ${escrowAddress}`);

  // ── 3. Log deployment summary ──
  console.log("\n═══════════════════════════════════════");
  console.log("  DEPLOYMENT SUMMARY");
  console.log("═══════════════════════════════════════");
  console.log(`  Network:     ${network.name}`);
  console.log(`  Chain ID:    ${network.config.chainId}`);
  console.log(`  MockUSDC:    ${usdcAddress}`);
  console.log(`  AltiPay:     ${escrowAddress}`);
  console.log(`  Deployer:    ${deployer.address}`);
  console.log("═══════════════════════════════════════\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

---

## 7. Estrategia de Testing

### 7.1 Categorías de Tests

```
┌─────────────────────────────────────────────────────────────┐
│                    PIRÁMIDE DE TESTING                       │
│                                                              │
│                        ╱╲                                    │
│                       ╱  ╲    E2E (Demo Script)              │
│                      ╱    ╲   — Flujo completo con wallet    │
│                     ╱──────╲                                 │
│                    ╱        ╲  Integration                   │
│                   ╱  Multi-  ╲ — Contrato + ERC-20           │
│                  ╱  contract  ╲ — Múltiples usuarios         │
│                 ╱──────────────╲                             │
│                ╱                ╲ Unit Tests                  │
│               ╱   Cada función   ╲ — Happy path + edge cases │
│              ╱    del contrato    ╲ — Reverts y modifiers    │
│             ╱──────────────────────╲                         │
│            ╱                        ╲ Security Tests         │
│           ╱  Reentrancy, overflow,   ╲                       │
│          ╱  front-running, DoS        ╲                      │
│         ╱──────────────────────────────╲                     │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Estructura de Tests Unitarios

```typescript
// test/AltiPayEscrow.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

describe("AltiPayEscrow", function () {

  async function deployFixture() {
    const [buyer, seller, attacker] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();

    const AltiPayEscrow = await ethers.getContractFactory("AltiPayEscrow");
    const escrow = await AltiPayEscrow.deploy();

    // Setup: mint y approve
    const amount = ethers.parseUnits("150", 6);
    await usdc.mint(buyer.address, ethers.parseUnits("1000", 6));
    await usdc.connect(buyer).approve(await escrow.getAddress(), amount);

    const secret = ethers.encodeBytes32String("ALTI7K9M");
    const secretHash = ethers.keccak256(
      ethers.solidityPacked(["bytes32"], [secret])
    );
    const deadline = (await time.latest()) + 3 * 24 * 60 * 60; // 3 días

    return { escrow, usdc, buyer, seller, attacker, amount, secret, secretHash, deadline };
  }

  describe("createOrder", () => {
    it("Should create order and transfer USDC to escrow", async () => { /* ... */ });
    it("Should revert if buyer == seller", async () => { /* ... */ });
    it("Should revert if amount is zero", async () => { /* ... */ });
    it("Should revert if deadline is in the past", async () => { /* ... */ });
    it("Should revert if insufficient USDC balance", async () => { /* ... */ });
    it("Should revert if USDC not approved", async () => { /* ... */ });
    it("Should emit OrderCreated event with correct params", async () => { /* ... */ });
  });

  describe("confirmDispatch", () => {
    it("Should update status to DISPATCHED", async () => { /* ... */ });
    it("Should revert if caller is not seller", async () => { /* ... */ });
    it("Should revert if order is not FUNDED", async () => { /* ... */ });
    it("Should store tracking info", async () => { /* ... */ });
  });

  describe("confirmDelivery", () => {
    it("Should transfer USDC to seller on valid secret", async () => { /* ... */ });
    it("Should revert on invalid secret", async () => { /* ... */ });
    it("Should revert if caller is not buyer", async () => { /* ... */ });
    it("Should set status to COMPLETED", async () => { /* ... */ });
    it("Should be callable from FUNDED state (skip dispatch)", async () => { /* ... */ });
  });

  describe("claimRefund", () => {
    it("Should refund buyer after deadline", async () => { /* ... */ });
    it("Should revert before deadline", async () => { /* ... */ });
    it("Should revert if caller is not buyer", async () => { /* ... */ });
    it("Should work on DISPATCHED orders past deadline", async () => { /* ... */ });
  });

  describe("cancelOrder", () => {
    it("Should refund buyer if order not dispatched", async () => { /* ... */ });
    it("Should revert if order is DISPATCHED", async () => { /* ... */ });
    it("Should revert if caller is not buyer", async () => { /* ... */ });
  });

  describe("Security", () => {
    it("Should prevent reentrancy attacks", async () => { /* ... */ });
    it("Should prevent front-running (only buyer can confirm)", async () => { /* ... */ });
    it("Should generate unique orderIds across chains", async () => { /* ... */ });
    it("Should not have any admin functions", async () => { /* ... */ });
  });
});
```

---

## 8. Modelo de Gas (Estimaciones)

| Función | Gas Estimado | Costo en Fuji (~25 gwei) | Costo en HSK |
|---------|-------------|-------------------------|-------------|
| `createOrder()` | ~130,000 | ~0.00325 AVAX | Bajo |
| `confirmDispatch()` | ~45,000 | ~0.001125 AVAX | Bajo |
| `confirmDelivery()` | ~65,000 | ~0.001625 AVAX | Bajo |
| `claimRefund()` | ~55,000 | ~0.001375 AVAX | Bajo |
| `cancelOrder()` | ~55,000 | ~0.001375 AVAX | Bajo |
| `getOrder()` (view) | 0 | Free | Free |

---

## 9. Seguridad — Análisis de Amenazas

### 9.1 Modelo de Amenazas STRIDE

| Amenaza | Tipo STRIDE | Mitigación |
|---------|------------|------------|
| Vendedor falsifica entrega | Spoofing | Solo el buyer puede revelar el secreto |
| Front-runner intercepta secreto | Tampering | `msg.sender == buyer` check impide uso por terceros |
| Fondos extraídos por admin | Elevation | Contrato sin funciones privilegiadas |
| Reentrancy en transferencia | Tampering | ReentrancyGuard + patrón CEI |
| Token malicioso con callbacks | Tampering | SafeERC20 + whitelist de tokens |
| Overflow en cálculos | Tampering | Solidity ^0.8.x checks nativos |
| DoS por gas limit | Denial of Service | Operaciones acotadas, sin loops |
| Replay attack cross-chain | Repudiation | `block.chainid` en orderId |

### 9.2 Invariantes del Contrato

```
INVARIANTE 1: La suma de todos los fondos bloqueados en el contrato
              siempre es igual a la suma de (amount) de todas las
              órdenes en estado FUNDED o DISPATCHED.

INVARIANTE 2: Una orden en estado COMPLETED o REFUNDED o CANCELLED
              tiene amount = 0 de fondos en el contrato.

INVARIANTE 3: Solo el buyer de una orden puede llamar a
              confirmDelivery, claimRefund y cancelOrder.

INVARIANTE 4: Solo el seller de una orden puede llamar a
              confirmDispatch.

INVARIANTE 5: No existe ninguna función que permita extraer
              fondos sin cumplir las condiciones del escrow.
```

---

## 10. Pipeline de CI/CD

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Git Push   │────>│   Compile    │────>│   Test       │────>│   Deploy     │
│              │     │   Contracts  │     │   Suite      │     │   Testnet    │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                      │
                                                                      ▼
                                                               ┌──────────────┐
                                                               │   Verify     │
                                                               │   on Explorer│
                                                               └──────────────┘
```

### 10.1 GitHub Actions Workflow

```yaml
# .github/workflows/contracts.yml
name: Smart Contracts CI

on:
  push:
    branches: [main, develop]
    paths: ['contracts/**', 'test/**', 'hardhat.config.ts']
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx hardhat compile
      - run: npx hardhat test
      - run: npx hardhat coverage

  deploy-testnet:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx hardhat run scripts/deploy.ts --network fuji
        env:
          DEPLOYER_PRIVATE_KEY: ${{ secrets.DEPLOYER_PRIVATE_KEY }}
      - run: npx hardhat run scripts/deploy.ts --network hskTestnet
        env:
          DEPLOYER_PRIVATE_KEY: ${{ secrets.DEPLOYER_PRIVATE_KEY }}
```

---

## 11. Variables de Entorno

```bash
# .env.example

# ── Deployer ──
DEPLOYER_PRIVATE_KEY=0x...

# ── Avalanche Fuji ──
SNOWTRACE_API_KEY=...
FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc

# ── HSK Testnet ──
HSK_TESTNET_RPC=https://testnet-rpc.hsk.xyz
HSK_CHAIN_ID=177

# ── Contract Addresses (post-deploy) ──
FUJI_ESCROW_ADDRESS=0x...
FUJI_USDC_ADDRESS=0x...
HSK_ESCROW_ADDRESS=0x...
HSK_USDC_ADDRESS=0x...
```

---

## 12. Dependencias del Proyecto

```json
{
  "devDependencies": {
    "@nomicfoundation/hardhat-toolbox": "^4.0.0",
    "@nomicfoundation/hardhat-verify": "^2.0.0",
    "@nomicfoundation/hardhat-network-helpers": "^1.0.0",
    "@openzeppelin/contracts": "^5.0.0",
    "hardhat": "^2.19.0",
    "hardhat-gas-reporter": "^1.0.0",
    "solidity-coverage": "^0.8.0",
    "dotenv": "^16.3.0",
    "typescript": "^5.3.0",
    "ts-node": "^10.9.0",
    "@types/node": "^20.0.0",
    "chai": "^4.3.0",
    "@types/chai": "^4.3.0"
  }
}
```
