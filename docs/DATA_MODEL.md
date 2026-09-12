# AltiPay Protocol — Modelo de Datos (Data Model)

> **Versión:** 1.0.0  
> **Estado:** Especificación MVP  
> **Fecha:** 2026-09-11  

---

## 1. Visión General del Modelo

AltiPay opera como un protocolo **stateless en backend** — toda la lógica de negocio y persistencia crítica reside en la blockchain (on-chain). El modelo de datos se divide en dos capas:

```
┌──────────────────────────────────────────────────────┐
│                   CAPA ON-CHAIN                       │
│   (Fuente de verdad — Smart Contract Storage)         │
│                                                       │
│   ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│   │    Order     │  │   OrderLog   │  │   Token    │ │
│   │   (struct)   │  │   (events)   │  │  (ERC-20)  │ │
│   └─────────────┘  └──────────────┘  └────────────┘ │
└──────────────────────────────────────────────────────┘
                         │
                    Indexación
                         │
┌──────────────────────────────────────────────────────┐
│                  CAPA OFF-CHAIN                       │
│   (Cache de lectura — Frontend / Subgraph)            │
│                                                       │
│   ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│   │  OrderCache  │  │  UserProfile │  │  ChainMeta │ │
│   │  (indexDB)   │  │  (localStorage)│ │  (config)  │ │
│   └─────────────┘  └──────────────┘  └────────────┘ │
└──────────────────────────────────────────────────────┘
```

---

## 2. Modelo On-Chain (Contrato Inteligente)

### 2.1 Enum: OrderStatus

```solidity
enum OrderStatus {
    NONE,        // 0 — Orden no existe (valor por defecto)
    FUNDED,      // 1 — Fondos depositados, esperando despacho
    DISPATCHED,  // 2 — Vendedor confirmó despacho de carga
    COMPLETED,   // 3 — Comprador confirmó recepción (fondos liberados)
    REFUNDED,    // 4 — Comprador reclamó reembolso por timeout
    CANCELLED    // 5 — Cancelada antes del despacho
}
```

### 2.2 Struct: Order

```solidity
struct Order {
    address buyer;          // Dirección del comprador (creador de la orden)
    address seller;         // Dirección del vendedor (receptor de fondos)
    address token;          // Dirección del token ERC-20 (USDC)
    uint256 amount;         // Monto custodiado (en unidades mínimas del token)
    bytes32 secretHash;     // keccak256(secret) — hash del código de entrega
    uint256 deadline;       // Timestamp Unix de expiración
    OrderStatus status;     // Estado actual de la orden
    string description;     // Descripción breve del paquete/carga
    string trackingInfo;    // Info de tracking (set por vendedor al despachar)
    uint256 createdAt;      // Timestamp de creación
    uint256 completedAt;    // Timestamp de completado/reembolso (0 si pendiente)
}
```

### 2.3 Mapping Principal (Storage)

```solidity
// Mapping de orderId => Order
mapping(bytes32 => Order) public orders;

// Contador global de órdenes (para generar IDs únicos)
uint256 public orderCount;

// Mapping de usuario => lista de orderIds (para consultas)
mapping(address => bytes32[]) public userOrders;
```

### 2.4 Diagrama Entidad-Relación (On-Chain)

```
┌───────────────────────────────────────────────────────────────┐
│                         ORDER                                  │
├───────────────────────────────────────────────────────────────┤
│ PK  orderId      : bytes32  (keccak256 hash único)           │
│     buyer         : address  (FK → EOA del comprador)         │
│     seller        : address  (FK → EOA del vendedor)          │
│     token         : address  (FK → contrato ERC-20)           │
│     amount        : uint256  (monto en wei/smallest unit)     │
│     secretHash    : bytes32  (keccak256 del código secreto)   │
│     deadline      : uint256  (unix timestamp de expiración)   │
│     status        : uint8    (enum OrderStatus)               │
│     description   : string   (descripción del paquete)        │
│     trackingInfo  : string   (info de rastreo)                │
│     createdAt     : uint256  (timestamp de creación)          │
│     completedAt   : uint256  (timestamp de resolución)        │
├───────────────────────────────────────────────────────────────┤
│ RELACIONES:                                                    │
│   buyer   ──────>  1 comprador tiene N órdenes como buyer     │
│   seller  ──────>  1 vendedor tiene N órdenes como seller     │
│   token   ──────>  N órdenes usan 1 token ERC-20              │
└───────────────────────────────────────────────────────────────┘
```

---

## 3. Eventos On-Chain (Log Model)

Los eventos son la principal interfaz de indexación para el frontend y subgraphs.

### 3.1 OrderCreated

```solidity
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
```

**Trigger:** `createOrder()` — cuando el comprador fondea la custodia.

### 3.2 OrderDispatched

```solidity
event OrderDispatched(
    bytes32 indexed orderId,
    address indexed seller,
    string trackingInfo
);
```

**Trigger:** `confirmDispatch()` — cuando el vendedor confirma el despacho.

### 3.3 OrderCompleted

```solidity
event OrderCompleted(
    bytes32 indexed orderId,
    address indexed seller,
    uint256 amount,
    uint256 completedAt
);
```

**Trigger:** `confirmDelivery()` — cuando el comprador revela el secreto.

### 3.4 OrderRefunded

```solidity
event OrderRefunded(
    bytes32 indexed orderId,
    address indexed buyer,
    uint256 amount,
    uint256 refundedAt
);
```

**Trigger:** `claimRefund()` — cuando el comprador reclama reembolso post-deadline.

### 3.5 OrderCancelled

```solidity
event OrderCancelled(
    bytes32 indexed orderId,
    address indexed buyer,
    uint256 amount
);
```

**Trigger:** `cancelOrder()` — cancelación antes del despacho.

---

## 4. Modelo Off-Chain (Frontend / IndexedDB)

### 4.1 OrderCache (IndexedDB)

Cache local para renderizado rápido del dashboard, sincronizado con eventos on-chain.

```typescript
interface OrderCache {
  orderId: string;           // bytes32 hex string
  buyer: string;             // Ethereum address (checksummed)
  seller: string;            // Ethereum address (checksummed)
  token: string;             // Token contract address
  amount: string;            // BigNumber string (wei units)
  amountFormatted: string;   // Human readable (e.g., "150.00 USDC")
  secretHash: string;        // bytes32 hex string
  secret?: string;           // Preimage (solo almacenado por el comprador, cifrado)
  deadline: number;          // Unix timestamp
  deadlineDate: string;      // ISO 8601 formatted
  status: OrderStatus;       // Enum mirror
  description: string;       // Descripción del paquete
  trackingInfo?: string;     // Info de rastreo (si existe)
  createdAt: number;         // Unix timestamp
  completedAt?: number;      // Unix timestamp (si aplica)
  chainId: number;           // Chain ID de la red
  txHash: string;            // Transaction hash de creación
  blockNumber: number;       // Bloque de creación
  lastSyncBlock: number;     // Último bloque sincronizado
}
```

### 4.2 UserProfile (localStorage)

```typescript
interface UserProfile {
  address: string;           // Dirección de la wallet conectada
  ensName?: string;          // ENS name (si existe)
  preferredChain: number;    // Chain ID preferido
  role: 'buyer' | 'seller' | 'both';  // Rol principal
  theme: 'light' | 'dark';  // Preferencia visual
  notifications: boolean;   // Notificaciones habilitadas
  lastLogin: number;         // Timestamp del último login
}
```

### 4.3 ChainConfig (Constantes)

```typescript
interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  contractAddress: string;    // Dirección del contrato AltiPay
  usdcAddress: string;        // Dirección del token USDC
  isTestnet: boolean;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}
```

**Configuraciones soportadas (MVP):**

```typescript
const SUPPORTED_CHAINS: ChainConfig[] = [
  {
    chainId: 43113,
    name: "Avalanche Fuji Testnet",
    rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
    explorerUrl: "https://testnet.snowtrace.io",
    contractAddress: "0x...",  // Deploy address
    usdcAddress: "0x...",      // Mock USDC on Fuji
    isTestnet: true,
    nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 }
  },
  {
    chainId: 177,  // HSK Testnet chain ID (ejemplo)
    name: "HSK Testnet",
    rpcUrl: "https://testnet-rpc.hsk.xyz",
    explorerUrl: "https://testnet-explorer.hsk.xyz",
    contractAddress: "0x...",
    usdcAddress: "0x...",
    isTestnet: true,
    nativeCurrency: { name: "HSK", symbol: "HSK", decimals: 18 }
  }
];
```

---

## 5. Generación de Order ID

El `orderId` se genera de forma determinista on-chain para evitar colisiones:

```solidity
bytes32 orderId = keccak256(abi.encodePacked(
    msg.sender,      // buyer address
    _seller,         // seller address
    _amount,         // monto
    _secretHash,     // hash del secreto
    orderCount,      // nonce global
    block.chainid    // chain ID (previene replay attacks cross-chain)
));
```

---

## 6. Generación del Código Secreto

El código secreto se genera **exclusivamente en el cliente** (nunca toca el backend o la blockchain):

```
┌─────────────────────────────────────────────────────────────┐
│  FLUJO DE GENERACIÓN DEL SECRETO                            │
│                                                              │
│  1. Frontend genera bytes aleatorios:                        │
│     secret = crypto.getRandomValues(new Uint8Array(32))      │
│                                                              │
│  2. Computa el hash:                                         │
│     secretHash = keccak256(secret)                           │
│                                                              │
│  3. Envía SOLO el hash al contrato:                          │
│     createOrder(..., secretHash, ...)                         │
│                                                              │
│  4. Almacena el secret cifrado en localStorage:              │
│     encrypted = AES-GCM(secret, walletDerivedKey)            │
│                                                              │
│  5. Genera código legible para el comprador:                 │
│     displayCode = base58(secret).slice(0, 8)                 │
│     → e.g., "ALTI-7K9M-X3PQ"                                │
│                                                              │
│  6. Para confirmar entrega, comprador ingresa el código:     │
│     → Frontend reconstruye el secret completo                │
│     → Llama a confirmDelivery(orderId, secret)               │
│     → Contrato verifica keccak256(secret) == secretHash      │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Diagrama de Máquina de Estados

```
                    createOrder()
        ┌──────────────────────────────┐
        │                              ▼
   ┌─────────┐                  ┌──────────┐
   │  NONE    │                  │  FUNDED  │
   │  (0)     │                  │  (1)     │
   └─────────┘                  └──────────┘
                                 │    │    │
                  cancelOrder()  │    │    │  confirmDispatch()
                  (pre-dispatch) │    │    │  (vendedor)
                                 │    │    │
                    ┌────────────┘    │    └────────────┐
                    ▼                 │                  ▼
              ┌───────────┐          │           ┌─────────────┐
              │ CANCELLED │          │           │ DISPATCHED  │
              │    (5)    │          │           │     (2)     │
              └───────────┘          │           └─────────────┘
                                     │                  │
                     claimRefund()   │                  │  confirmDelivery()
                     (post-deadline) │                  │  (comprador + secret)
                                     │                  │
                              ┌──────┘                  └──────┐
                              ▼                                 ▼
                       ┌───────────┐                     ┌───────────┐
                       │ REFUNDED  │                     │ COMPLETED │
                       │    (4)    │                     │    (3)    │
                       └───────────┘                     └───────────┘
```

### Transiciones Válidas:

| Desde | Hacia | Función | Actor | Condición |
|-------|-------|---------|-------|-----------|
| NONE | FUNDED | `createOrder()` | Comprador | Aprobación ERC-20, monto > 0 |
| FUNDED | DISPATCHED | `confirmDispatch()` | Vendedor | Solo el vendedor asignado |
| FUNDED | CANCELLED | `cancelOrder()` | Comprador | Solo antes del despacho |
| FUNDED | REFUNDED | `claimRefund()` | Comprador | `block.timestamp > deadline` |
| DISPATCHED | COMPLETED | `confirmDelivery()` | Comprador | `keccak256(secret) == secretHash` |
| DISPATCHED | REFUNDED | `claimRefund()` | Comprador | `block.timestamp > deadline` |

### Transiciones Inválidas (Bloqueadas):

- COMPLETED → cualquier estado (terminal)
- REFUNDED → cualquier estado (terminal)
- CANCELLED → cualquier estado (terminal)
- Cualquier actor que no sea buyer/seller asignado

---

## 8. Modelo de Datos para Subgraph (The Graph)

Para indexación avanzada en producción (post-MVP):

```graphql
type Order @entity {
  id: ID!                    # orderId (bytes32)
  buyer: Bytes!              # address
  seller: Bytes!             # address
  token: Bytes!              # address
  amount: BigInt!            # uint256
  secretHash: Bytes!         # bytes32
  deadline: BigInt!          # uint256
  status: OrderStatus!       # enum
  description: String!       # string
  trackingInfo: String       # string (nullable)
  createdAt: BigInt!         # uint256
  completedAt: BigInt        # uint256 (nullable)
  creationTx: Bytes!         # tx hash
  completionTx: Bytes        # tx hash (nullable)
  blockNumber: BigInt!       # block number
}

enum OrderStatus {
  NONE
  FUNDED
  DISPATCHED
  COMPLETED
  REFUNDED
  CANCELLED
}

type User @entity {
  id: ID!                    # address
  ordersAsBuyer: [Order!]!   # Órdenes como comprador
  ordersAsSeller: [Order!]!  # Órdenes como vendedor
  totalBought: BigInt!       # Volumen total comprado
  totalSold: BigInt!         # Volumen total vendido
  orderCount: BigInt!        # Total de órdenes
}
```

---

## 9. Consideraciones de Seguridad del Modelo

| Aspecto | Medida |
|---------|--------|
| **Secret nunca on-chain** | Solo `secretHash` se almacena en storage. El preimage se revela solo al confirmar entrega. |
| **Replay attack** | `block.chainid` incluido en la generación del `orderId` previene replay cross-chain. |
| **Front-running** | El secreto se envía en la transacción de confirmación; un front-runner que intercepte el mempool no puede usar el secreto porque `msg.sender` debe ser el buyer. |
| **Overflow** | Solidity ^0.8.x tiene checks nativos de overflow/underflow. |
| **Reentrancy** | Patrón CEI: actualizar estado ANTES de transferir tokens. |
| **Token malicioso** | MVP usa whitelist de tokens permitidos (solo USDC verificado). |

---

## 10. Volumen de Datos Estimado (MVP)

| Métrica | Estimación |
|---------|-----------|
| Órdenes en demo | 5-20 |
| Storage por orden | ~320 bytes (struct) |
| Eventos por orden | 2-3 (created + dispatched + completed/refunded) |
| Gas por createOrder | ~120k-150k gas |
| Gas por confirmDelivery | ~60k-80k gas |
| Gas por claimRefund | ~50k-70k gas |
