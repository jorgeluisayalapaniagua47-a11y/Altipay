# ⚡ AltiPay Protocol — Guía Maestra de Ingeniería: DESARROLLADOR 2
## 🧑‍💻 Jorge Luis Ayala Paniagua — Web3 Core & SDK Integrations Engineer

> **Versión:** 1.0.0 — Hackathon Edition  
> **Estado:** Documento de Planificación y Ejecución Técnica por Tickets  
> **Responsable:** **Jorge Luis Ayala Paniagua (DEV 2)**  
> **Bounties bajo su custodia:** **Pollar Mainnet USDC** · **Unlock Protocol VIP Membership**  
> **Handoffs principales:** Provee hooks e infraestructura Web3 a **Eddy Galvan (DEV 3)** y **Joseca (DEV 4)**; consume ABIs y contratos de **Luis Sandoval (DEV 1)**.

---

## 🧭 1. Delimitación Estricta de Funciones (Zero-Overlap)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        FRONTERAS DE RESPONSABILIDAD (ZERO CLASH)                       │
│                                                                                        │
│  ✅ TU DOMINIO EXCLUSIVO (Jorge Ayala - DEV 2):                                        │
│     • Conectividad Web3 cliente: Wagmi v2, Viem, RainbowKit.                           │
│     • Custom Hooks transaccionales (`useAltiPayEscrow`, `useUSDC`, `useUnlockVIP`).    │
│     • Integración del Checkout SDK de Pollar (`@pollar/react` / `PollarCheckoutButton`).│
│     • Integración de Unlock Protocol (detección de VIP NFT Key para 0% fee).           │
│     • Servicio centralizado de transacciones (`services/transactionHandler.ts`).       │
│     • Soporte de cableado Web3 en las pantallas de DEV 3 y DEV 4.                      │
│                                                                                        │
│  ❌ NO TOCAS (En manos de Luis Sandoval - DEV 1):                                      │
│     • Contratos Solidity (`AltiPayEscrow.sol`, `MockUSDC.sol`).                        │
│     • Tests de Foundry/Hardhat y scripts de deploy on-chain.                           │
│                                                                                        │
│  ❌ NO TOCAS (En manos de Eddy Galvan - DEV 3):                                        │
│     • Diseño CSS/Tailwind, Landing Page, maquetación de `/create` y keypad táctil.     │
│                                                                                        │
│  ❌ NO TOCAS (En manos de Joseca - DEV 4):                                             │
│     • Maquetación del dashboard de vendedor `/seller`, fotos de guía, APIs off-chain.  │
│     • Video pitch Vaquita y slides de presentación.                                    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 2. Tablero de Tickets Técnicos (Sprint Hackathon)

### Resumen de Estados:
* 🟢 **Completado (Done):** 2 tickets
* 🟡 **En Progreso (In Progress):** 3 tickets
* 🔴 **Por Iniciar (Pending):** 3 tickets

| ID Ticket | Nombre del Ticket | Prioridad | Estimación | Estado | Archivos Principales |
|---|---|:---:|:---:|:---:|---|
| **[TK-JORGE-01](#tk-jorge-01-configuración-multichain-wagmi-v2--rainbowkit)** | Configuración Multichain Wagmi v2 & RainbowKit | **P0 (Bloqueante)** | 1.5 h | 🟢 **Done (90%)** | `config/wagmi.ts`, `components/web3/*` |
| **[TK-JORGE-02](#tk-jorge-02-hooks-transaccionales-de-altipayescrow)** | Hooks Transaccionales de `AltiPayEscrow` | **P0 (Bloqueante)** | 2.5 h | 🟡 **In Progress (85%)** | `hooks/useAltiPayEscrow.ts`, `contracts/index.ts` |
| **[TK-JORGE-03](#tk-jorge-03-hook-de-aprobación-balance-y-faucet-mockusdc)** | Hook de Aprobación, Balance y Faucet `MockUSDC` | **P0 (Bloqueante)** | 1.5 h | 🟢 **Done (95%)** | `hooks/useUSDC.ts` |
| **[TK-JORGE-04](#tk-jorge-04-servicio-centralizado-de-transacciones-y-toasts)** | Servicio Centralizado de Transacciones & Toasts | **P1 (Core UX)** | 1.5 h | 🔴 **Pending** | `services/transactionHandler.ts` |
| **[TK-JORGE-05](#tk-jorge-05-bounty-unlock-protocol-hook-y-badge-vip)** | [Bounty] Unlock Protocol Hook & Badge VIP | **P1 (Bounty)** | 2.0 h | 🟡 **In Progress (75%)** | `hooks/useUnlockVIP.ts` |
| **[TK-JORGE-06](#tk-jorge-06-bounty-pollar-mainnet-usdc-checkout-engine)** | [Bounty] Pollar Mainnet USDC Checkout Engine | **P1 (Bounty)** | 2.0 h | 🟡 **In Progress (70%)** | `components/bounties/PollarCheckoutButton.tsx` |
| **[TK-JORGE-07](#tk-jorge-07-integración-y-cableado-con-vistas-de-dev-3-y-dev-4)** | Integración y Cableado con Vistas de DEV 3 y DEV 4 | **P1 (Handoff)** | 3.0 h | 🔴 **Pending** | `app/create/page.tsx`, `app/seller/page.tsx`, `app/order/[id]/page.tsx` |
| **[TK-JORGE-08](#tk-jorge-08-pruebas-transaccionales-e2e-en-testnet)** | Pruebas Transaccionales E2E en Testnet (HSK / Fuji) | **P2 (QA)** | 2.0 h | 🔴 **Pending** | Consola dApp / Explorador de bloques |

---

## 🎫 3. Especificación Detallada de Cada Ticket

---

### <a id="tk-jorge-01-configuración-multichain-wagmi-v2--rainbowkit"></a>🎫 TK-JORGE-01: Configuración Multichain Wagmi v2 & RainbowKit
* **Tipo:** Tarea de Infraestructura Web3  
* **Prioridad:** `P0 (Crítica / Bloqueante)`  
* **Estado:** 🟢 **Casi Terminado (90%)**  
* **Archivos Involucrados:**
  * `frontend/config/wagmi.ts`
  * `frontend/components/web3/Web3Provider.tsx`
  * `frontend/components/web3/ConnectWalletButton.tsx`

#### 🎯 Descripción:
Configurar la capa base de conectividad de billeteras (RainbowKit + Wagmi v2 + TanStack Query) con soporte para las redes requeridas por los bounties:
1. **HashKey Chain Testnet (HSK)** — Chain ID `133` (RPC: `https://hashkeychain-testnet.alt.technology`).
2. **Avalanche Fuji Testnet** — Chain ID `43113` (RPC: `https://api.avax-test.network/ext/bc/C/rpc`).
3. **Hardhat Localhost** — Chain ID `31337` (para pruebas locales de desarrollo).

#### 📋 Criterios de Aceptación (DoD):
* [x] Cadena HSK definida con nombre, moneda nativa (`HSK`), RPCs y explorador oficial.
* [x] `Web3Provider.tsx` encapsula RainbowKit y React Query con `ssr: true`.
* [x] Botón `ConnectWalletButton.tsx` estilizado con soporte de cambio de red automático si el usuario está en una red no soportada.
* [ ] **Pendiente:** Probar conexión real con MetaMask / Rabby Wallet y verificar que no haya errores de hidratación SSR en Next.js 14.

---

### <a id="tk-jorge-02-hooks-transaccionales-de-altipayescrow"></a>🎫 TK-JORGE-02: Hooks Transaccionales de `AltiPayEscrow`
* **Tipo:** Feature / Contratos en Frontend  
* **Prioridad:** `P0 (Crítica / Bloqueante)`  
* **Estado:** 🟡 **En Progreso (85%)**  
* **Archivos Involucrados:**
  * `frontend/hooks/useAltiPayEscrow.ts`
  * `frontend/contracts/index.ts`
  * `frontend/contracts/deployedContracts.ts`

#### 🎯 Descripción:
Exponer todas las operaciones del contrato `AltiPayEscrow` de forma limpia y tipada para que DEV 3 y DEV 4 puedan invocar transacciones sin saber detalles internos de Viem ni de ABIs:
1. `createOrder(...)`: Convierte el PIN a `bytes32`, calcula el hash `keccak256`, pasa monto con 6 decimales (`parseUnits(amount, 6)`), y envía TX a `createOrder`.
2. `confirmDispatch(...)`: Vendedor envía guía física (ej. `"Flota Bolívar #4819"`).
3. `confirmDeliveryWithSecret(...)`: Comprador ingresa PIN; convierte a `bytes32` y ejecuta liberación atómica del 100% al vendedor.
4. `claimRefund(...)`: Comprador reclama reembolso si venció el deadline.
5. `cancelOrder(...)`: Cancelación previa a despacho.
6. `useGetOrder(orderId)` y `useGetUserOrders(address)`: Lecturas reactivas del estado on-chain.

#### 📋 Criterios de Aceptación (DoD):
* [x] Mapeo de `OrderStatus` tipado (`NONE`, `FUNDED`, `DISPATCHED`, `COMPLETED`, `REFUNDED`, `CANCELLED`).
* [x] Hash `keccak256` idéntico a `abi.encodePacked(bytes32(_secret))` del contrato Solidity.
* [x] Manejo de `query.enabled` en hooks de lectura para evitar consultas con argumentos nulos.
* [ ] **Pendiente:** Añadir retorno de `isWaitingTx` o `waitForTransactionReceipt` para saber cuándo la transacción ya fue minada en bloque.

---

### <a id="tk-jorge-03-hook-de-aprobación-balance-y-faucet-mockusdc"></a>🎫 TK-JORGE-03: Hook de Aprobación, Balance y Faucet `MockUSDC`
* **Tipo:** Feature / Token ERC-20  
* **Prioridad:** `P0 (Crítica / Bloqueante)`  
* **Estado:** 🟢 **Casi Terminado (95%)**  
* **Archivos Involucrados:**
  * `frontend/hooks/useUSDC.ts`
  * `frontend/contracts/index.ts` (definición de `ERC20_ABI`)

#### 🎯 Descripción:
Antes de que un comprador pueda crear una custodia en `AltiPayEscrow`, el contrato necesita permiso (`allowance`) para transferir su USDC mediante `SafeERC20.safeTransferFrom`. Además, para demos y jurados en testnet, se debe proveer un faucet libre de fondos.

#### 📋 Criterios de Aceptación (DoD):
* [x] Lectura reactiva de `balanceOf` y `allowance` formateados a 6 decimales.
* [x] Función `approveEscrow(amount)` para conceder permiso exacto al contrato Escrow.
* [x] Función `claimFaucet("500")` que invoca `faucet(address, amount)` de `MockUSDC.sol`.
* [x] Helper `hasSufficientAllowance(amount)` que retorna booleano instantáneo para habilitar/deshabilitar botones en la UI de DEV 3.
* [ ] **Pendiente:** Verificar que al cambiar de red (de HSK a Fuji), la dirección del token USDC se actualice dinámicamente sin recargar la página.

---

### <a id="tk-jorge-04-servicio-centralizado-de-transacciones-y-toasts"></a>🎫 TK-JORGE-04: Servicio Centralizado de Transacciones & Toasts
* **Tipo:** UX / Notificaciones & Manejo de Errores  
* **Prioridad:** `P1 (Alta / Calidad de Producto)`  
* **Estado:** 🔴 **Pendiente**  
* **Archivos Involucrados:**
  * `frontend/services/transactionHandler.ts` (Nuevo archivo)
  * `frontend/app/layout.tsx` (Verificar provider de `sonner` o toasts)

#### 🎯 Descripción:
Implementar un envoltorio unificado para ejecutar transacciones Web3 que proporcione feedback visual instantáneo mediante notificaciones toast (Sonner / React Hot Toast):
* **Estado Pendiente:** Toast animado con spinner ("Firmando transacción en wallet...").
* **Estado Minando:** Toast con hash y link directo al explorador de bloques (HashKey Explorer / Snowtrace).
* **Estado Éxito:** Toast verde de confirmación ("✅ Custodia creada exitosamente").
* **Estado Error:** Parser amigable de errores comunes (User rejected, Insufficient funds, Deadline expired).

#### 📋 Criterios de Aceptación (DoD):
* [ ] Crear `frontend/services/transactionHandler.ts`.
* [ ] Función `executeWithToast(promise, messages, explorerUrl)`.
* [ ] Mapeo de errores de MetaMask/Viem (`UserRejectedRequestError` ➔ "Operación cancelada por el usuario").
* [ ] Enlace clicable al explorador configurado según la red activa.

---

### <a id="tk-jorge-05-bounty-unlock-protocol-hook-y-badge-vip"></a>🎫 TK-JORGE-05: [Bounty] Unlock Protocol Hook & Badge VIP
* **Tipo:** Integración de Patrocinador (Bounty Unlock)  
* **Prioridad:** `P1 (Bounty ➔ 0% Comisiones)`  
* **Estado:** 🟡 **En Progreso (75%)**  
* **Archivos Involucrados:**
  * `frontend/hooks/useUnlockVIP.ts`
  * `frontend/components/bounties/UnlockVIPBadge.tsx` (Componente UI complementario)

#### 🎯 Descripción:
Permitir a los comerciantes bolivianos obtener **0% de comisión de protocolo** si son poseedores de una NFT Key de Unlock Protocol.
* El contrato `AltiPayEscrow.sol` consulta `vipLock.getHasValidKey(buyer)`.
* El frontend debe leer este estado para reflejar en el formulario de compra si se aplica la tarifa estándar del 0.5% o el 0.0% VIP.

#### 📋 Criterios de Aceptación (DoD):
* [x] Hook `useUnlockVIP()` consulta la función `vipLock()` del contrato Escrow.
* [x] Consulta `getHasValidKey(userAddress)` sobre la dirección del Lock de Unlock.
* [x] Retorna `{ isVIP, feePercent, feeBasisPoints, statusText, refetchVIPStatus }`.
* [ ] **Pendiente:** Crear `UnlockVIPBadge.tsx` que muestre una insignia dorada: *"🌟 Miembro VIP AltiPay (Comisión 0%)"* o botón para adquirir membresía.
* [ ] **Pendiente:** Conectar el valor `feePercent` al formulario de DEV 3 en `/create`.

---

### <a id="tk-jorge-06-bounty-pollar-mainnet-usdc-checkout-engine"></a>🎫 TK-JORGE-06: [Bounty] Pollar Mainnet USDC Checkout Engine
* **Tipo:** Integración de Patrocinador (Bounty Pollar)  
* **Prioridad:** `P1 (Bounty Mainnet Pollar)`  
* **Estado:** 🟡 **En Progreso (70%)**  
* **Archivos Involucrados:**
  * `frontend/components/bounties/PollarCheckoutButton.tsx`

#### 🎯 Descripción:
Pollar premia proyectos que utilicen su protocolo para cobros/pagos en Mainnet.
* `PollarCheckoutButton.tsx` permite fondear órdenes comerciales con USDC en mainnet directamente como alternativa a testnet.
* Debe integrarse en el checkout del comprador para que el usuario pueda elegir entre:
  * Pagar con `MockUSDC` (Modo Testnet HSK / Fuji)
  * Pagar con `Pollar Checkout` (Modo Mainnet Real)

#### 📋 Criterios de Aceptación (DoD):
* [x] Componente `PollarCheckoutButton.tsx` con diseño institucional, badge "Mainnet Ready" y cálculo de monto.
* [x] Callback `onSuccess(txHash)` que notifica la orden fondeada.
* [ ] **Pendiente:** Conectar el callback con el almacenamiento de la orden para que DEV 4 (vendedor) vea la orden en estado `FUNDED`.
* [ ] **Pendiente:** Preparar toggle en `/create` para seleccionar: "Método de Pago: [MockUSDC Testnet] | [Pollar Mainnet]".

---

### <a id="tk-jorge-07-integración-y-cableado-con-vistas-de-dev-3-y-dev-4"></a>🎫 TK-JORGE-07: Integración y Cableado con Vistas de DEV 3 y DEV 4
* **Tipo:** Integración Frontend & Handoff  
* **Prioridad:** `P1 (Convergencia)`  
* **Estado:** 🔴 **Pendiente (Esperando vistas maquetadas)**  
* **Archivos Involucrados:**
  * `frontend/app/create/page.tsx` (DEV 3 - Buyer Flow)
  * `frontend/app/seller/page.tsx` (DEV 4 - Seller Dashboard)
  * `frontend/app/order/[id]/page.tsx` (DEV 4 - Order Timeline & PIN release)

#### 🎯 Descripción:
Acompañar a DEV 3 y DEV 4 en la inyección de los hooks reales, reemplazando datos dummy / mocks locales:
1. **En `/create`:**
   * Conectar `useUSDC` (`balance`, `allowance`, `approveEscrow`).
   * Conectar `useAltiPayEscrow.createOrder`.
   * Conectar `useUnlockVIP` para mostrar el desglose de comisiones (0% vs 0.5%).
2. **En `/seller`:**
   * Conectar `useGetUserOrders` o `useGetOrder` para cargar las órdenes del vendedor conectado.
   * Conectar `useAltiPayEscrow.confirmDispatch` al modal de despacho de guía.
3. **En `/order/[id]`:**
   * Conectar `useGetOrder` para pintar los datos on-chain (monto, estado, guía).
   * Conectar `useAltiPayEscrow.confirmDeliveryWithSecret` al keypad numérico de DEV 3.
   * Conectar `useAltiPayEscrow.claimRefund` al botón de reclamo por expiración.

#### 📋 Criterios de Aceptación (DoD):
* [ ] Ninguna vista tiene botones deshabilitados sin explicación o llamadas a mocks una vez que los hooks estén conectados.
* [ ] El flujo completo (Crear ➔ Despachar ➔ Liberar) funciona de extremo a extremo desde el navegador con dos billeteras distintas.

---

### <a id="tk-jorge-08-pruebas-transaccionales-e2e-en-testnet"></a>🎫 TK-JORGE-08: Pruebas Transaccionales E2E en Testnet (HSK / Fuji)
* **Tipo:** Calidad / Demo Ready  
* **Prioridad:** `P2 (Validación Final Hackathon)`  
* **Estado:** 🔴 **Pendiente**  
* **Ambiente de Pruebas:**
  * **HashKey Chain Testnet** (`Chain ID: 133`)
  * **Avalanche Fuji Testnet** (`Chain ID: 43113`)

#### 🎯 Descripción:
Ejecutar el Happy Path completo en testnet real utilizando las cuentas fondeadas con 10,000 MockUSDC:
1. **Wallet A (Comprador - Jorge):** Entra a `/create`, mintea MockUSDC del faucet, aprueba escrow y crea una orden de 150 USDC con PIN `"749201"` y descripción `"Repuestos de camión - Oruro a Cochabamba"`.
2. **Wallet B (Vendedor - Joseca/Eddy):** Abre `/seller`, verifica la tarjeta verde *"Depósito Bloqueado y Garantizado de 150 USDC"*, y registra la guía `"Flota Bolívar Guía #90214"`.
3. **Wallet A (Comprador en Terminal):** Revisa que el status cambió a `DISPATCHED`, ingresa el PIN `"749201"` en el keypad y confirma.
4. **Verificación On-Chain:** Comprobar que Wallet B recibió los 150 USDC y la orden quedó en `COMPLETED`.

#### 📋 Criterios de Aceptación (DoD):
* [ ] Transacción de creación visible en el explorador de HashKey.
* [ ] Transacción de despacho minada.
* [ ] Transacción de liberación exitosa con secreto correcto.
* [ ] Hash de prueba copiado para el entregable de Devfolio y slides del pitch.

---

## 🛠️ 4. Guía Rápida de Comandos para DEV 2

```bash
# Entrar al frontend
cd frontend

# Instalar dependencias si agregas algún paquete
npm install

# Correr el servidor de desarrollo
npm run dev

# Validar que TypeScript no tenga errores de tipos
npm run build
```

---

## 🤝 5. Puntos de Contacto con tus Compañeros

* **Con Luis Sandoval (DEV 1):** Si Luis redespliega o agrega parámetros al contrato, solo necesitas que te pase el JSON de `deployedContracts.ts` y actualizar `frontend/contracts/deployedContracts.ts`.
* **Con Eddy Galvan (DEV 3):** Dale los props exactos de `useAltiPayEscrow` y `useUSDC` para que sus formularios en `/create` y el keypad no requieran lógica blockchain adentro.
* **Con Joseca (DEV 4):** Facilítale `useGetOrder` y el estado de la orden para que su timeline y el generador de QR en `/order/[id]` reflejen datos reales.
