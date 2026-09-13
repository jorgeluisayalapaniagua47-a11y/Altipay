# 🔐 AltiPay Protocol — Guía Maestra de Variables de Entorno (`.env` y `.env.local`)

> **Documento Oficial del Proyecto AltiPay**  
> **Ubicación en Docs:** `docs/ENV_VARIABLES.md` (Espejo en raíz: `ENV_VARIABLES.md`)  
> **Última actualización:** 2026-09-13  
> **Audiencia:** Equipo de Desarrollo (Smart Contracts, Backend Scripts, Frontend Web3)

---

## 📋 Tabla de Contenidos
1. [Arquitectura de Entornos en AltiPay](#1-arquitectura-de-entornos-en-altipay)
2. [Variables de la Raíz (`/.env` y `/.env.example`)](#2-variables-de-la-raíz-env-y-envexample)
   - [Tabla Resumen de Claves](#tabla-resumen-de-claves-raíz)
   - [Detalle de cada Variable](#detalle-de-cada-variable-raíz)
   - [Variables Adicionales para Scripts de Distribución](#variables-adicionales-para-scripts)
3. [Variables del Frontend (`/frontend/.env.local` y `/frontend/.env.example`)](#3-variables-del-frontend-frontendenvlocal)
   - [Tabla Resumen de Claves](#tabla-resumen-de-claves-frontend)
   - [Detalle de cada Variable](#detalle-de-cada-variable-frontend)
4. [Matriz de Sincronización (Backend ↔ Frontend)](#4-matriz-de-sincronización-backend--frontend)
5. [Guía de Configuración Rápida (Paso a Paso)](#5-guía-de-configuración-rápida-paso-a-paso)
6. [Plantillas Listas para Copiar y Pegar](#6-plantillas-listas-para-copiar-y-pegar)
   - [Bloque 1: `/.env` (Raíz)](#bloque-1-env-raíz)
   - [Bloque 2: `/frontend/.env.local` (Frontend)](#bloque-2-frontendenvlocal-frontend)
7. [Seguridad y Buenas Prácticas](#7-seguridad-y-buenas-prácticas)

---

## 1. Arquitectura de Entornos en AltiPay

El proyecto **AltiPay Protocol** está dividido en dos capas bien diferenciadas que requieren configuraciones de entorno independientes:

```
c:\Altipay
├── .env                  <--- Raíz: Hardhat, despliegues, tareas y scripts de testing
├── .env.example          <--- Plantilla pública para el entorno de contratos
├── hardhat.config.ts     <--- Consume process.env de la raíz
├── scripts/              <--- Consumen process.env de la raíz
│
└── frontend/
    ├── .env.local        <--- Frontend: Next.js 15, Wagmi v2, RainbowKit, Viem
    ├── .env.example      <--- Plantilla pública para el frontend
    └── config/wagmi.ts   <--- Consume process.env.NEXT_PUBLIC_*
```

* **Capa Raíz (Smart Contracts & Hardhat)**: Utiliza `dotenv` para Node.js. Administra la clave privada del deployer (`DEPLOYER_PRIVATE_KEY`), RPCs de red, API keys de exploradores para verificación y las direcciones de contratos desplegados.
* **Capa Frontend (Next.js & Web3 dApp)**: Utiliza el sistema nativo de Next.js (`.env.local`). Todas las variables públicas que deban ser leídas en el navegador del usuario van prefijadas obligatoriamente con `NEXT_PUBLIC_`.

---

## 2. Variables de la Raíz (`/.env` y `/.env.example`)

Ubicación: `c:\Altipay\.env`

### Tabla Resumen de Claves (Raíz)

| Variable | Tipo / Formato | Obligatorio | Valor Actual / Ejemplo | Propósito |
| :--- | :--- | :---: | :--- | :--- |
| `DEPLOYER_PRIVATE_KEY` | Hex String (`64` o `66` chars) | **Sí** | `5b3e9e746cd6ca...` | Clave privada que firma el despliegue de contratos y transacciones de administración. |
| `AVALANCHE_FUJI_RPC` | URL | **Sí** | `https://api.avax-test.network/ext/bc/C/rpc` | Endpoint RPC para interactuar con Avalanche C-Chain Testnet (Fuji). |
| `HSK_TESTNET_RPC` | URL | **Sí** | `https://testnet.hsk.xyz` | Endpoint RPC para interactuar con HashKey Chain Testnet. |
| `SNOWTRACE_API_KEY` | String | No | *(vacío o API Key de Snowtrace)* | API key para verificar el código fuente de los contratos en Snowtrace / Etherscan. |
| `FEE_RECIPIENT_ADDRESS` | Ethereum Address (`0x...`) | **Sí** | `0x4aBc6cbb4317ecd019aB7889B9B432DDbc8B6476` | Billetera de tesorería del protocolo que recibe la comisión del 0.5% en cada orden completada. |
| `UNLOCK_VIP_LOCK_ADDRESS` | Ethereum Address (`0x...`) | **Sí** | `0x0000000000000000000000000000000000000000` | Dirección del contrato Lock de Unlock Protocol ("AltiPay VIP Key" para 0% fee). |
| `ESCROW_FUJI_ADDRESS` | Ethereum Address (`0x...`) | **Sí** | `0xC7d4d9a5708185761DDb65e014a0691C1f99679A` | Contrato `AltiPayEscrow` desplegado en Avalanche Fuji. |
| `USDC_FUJI_ADDRESS` | Ethereum Address (`0x...`) | **Sí** | `0xAe9F9d28E0Ba5Ea67dE0F3C82dc7e7215b6c855C` | Contrato `MockUSDC` desplegado en Avalanche Fuji. |
| `ESCROW_HSK_ADDRESS` | Ethereum Address (`0x...`) | **Sí** | `0xC7d4d9a5708185761DDb65e014a0691C1f99679A` | Contrato `AltiPayEscrow` desplegado en HashKey Testnet. |
| `USDC_HSK_ADDRESS` | Ethereum Address (`0x...`) | **Sí** | `0xAe9F9d28E0Ba5Ea67dE0F3C82dc7e7215b6c855C` | Contrato `MockUSDC` desplegado en HashKey Testnet. |
| `ESCROW_LOCAL_ADDRESS` | Ethereum Address (`0x...`) | Opcional | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` | Dirección de `AltiPayEscrow` para pruebas con `npx hardhat node` local. |
| `USDC_LOCAL_ADDRESS` | Ethereum Address (`0x...`) | Opcional | `0x5FbDB2315678afecb367f032d93F642f64180aa3` | Dirección de `MockUSDC` para pruebas con `npx hardhat node` local. |

---

### Detalle de cada Variable (Raíz)

#### 1. `DEPLOYER_PRIVATE_KEY`
- **Descripción:** Es la clave privada de la cuenta de Ethereum que pagará el gas para compilar, desplegar y administrar los contratos inteligentes en las redes de prueba o producción.
- **Uso en código:** [hardhat.config.ts](file:///c:/Altipay/hardhat.config.ts#L7).
- **Importante:** Puede colocarse con el prefijo `0x` o sin él (Hardhat lo sanitiza automáticamente). En pruebas locales se usa la cuenta por defecto de Hardhat (`0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`). **NUNCA utilices tu clave privada principal de mainnet.**

#### 2. `AVALANCHE_FUJI_RPC`
- **Descripción:** URL del nodo RPC para la red de prueba Avalanche Fuji (Chain ID 43113).
- **Uso en código:** [hardhat.config.ts](file:///c:/Altipay/hardhat.config.ts#L27).
- **Endpoint oficial:** `https://api.avax-test.network/ext/bc/C/rpc`

#### 3. `HSK_TESTNET_RPC`
- **Descripción:** URL del nodo RPC para la testnet de HashKey Chain (Chain ID 133).
- **Uso en código:** [hardhat.config.ts](file:///c:/Altipay/hardhat.config.ts#L33).
- **Endpoints disponibles:** `https://testnet.hsk.xyz` o `https://hashkeychain-testnet.alt.technology`

#### 4. `SNOWTRACE_API_KEY`
- **Descripción:** Llave de API del explorador de bloques Snowtrace para verificar y publicar el código fuente de los contratos de forma automática con `@nomicfoundation/hardhat-verify`.
- **Uso en código:** [hardhat.config.ts](file:///c:/Altipay/hardhat.config.ts#L9).

#### 5. `FEE_RECIPIENT_ADDRESS`
- **Descripción:** Dirección de la billetera que recibe las tarifas del protocolo (0.50% de cada orden completada sin membresía VIP). Se pasa como parámetro en el constructor del contrato `AltiPayEscrow`.
- **Uso en código:** [scripts/deploy-escrow.ts](file:///c:/Altipay/scripts/deploy-escrow.ts#L12).

#### 6. `UNLOCK_VIP_LOCK_ADDRESS`
- **Descripción:** Dirección del contrato Lock de Unlock Protocol (ERC-721 / PublicLock). Si un usuario posee un NFT válido de este contrato, el Escrow exonera el 100% de las comisiones (0% fee). Si no está disponible en la red, se coloca la dirección nula `0x0000000000000000000000000000000000000000`.
- **Uso en código:** [scripts/deploy-escrow.ts](file:///c:/Altipay/scripts/deploy-escrow.ts#L13).

#### 7. `ESCROW_FUJI_ADDRESS` & `USDC_FUJI_ADDRESS`
- **Descripción:** Direcciones de los contratos `AltiPayEscrow` y `MockUSDC` desplegados en Avalanche Fuji. Son leídas por el script [scripts/export-artifacts.ts](file:///c:/Altipay/scripts/export-artifacts.ts) para generar las configuraciones del frontend.

#### 8. `ESCROW_HSK_ADDRESS` & `USDC_HSK_ADDRESS`
- **Descripción:** Direcciones de los contratos `AltiPayEscrow` y `MockUSDC` desplegados en HashKey Chain Testnet.

#### 9. `ESCROW_LOCAL_ADDRESS` & `USDC_LOCAL_ADDRESS`
- **Descripción:** Direcciones de contratos para desarrollo local con nodo Hardhat simulado (`npx hardhat node`).

---

### Variables Adicionales para Scripts

Utilizadas en [scripts/distribute-mock-usdc.ts](file:///c:/Altipay/scripts/distribute-mock-usdc.ts) para enviar automáticamente 10,000 USDC de prueba a los miembros del equipo:

| Variable | Valor por Defecto | Titular |
| :--- | :--- | :--- |
| `JORGE_WALLET` | `0x9e1D25C3b9e4210B309A4D304aF96085a6B74f7A` | Jorge Ayala (DEV 2) |
| `EDDY_WALLET` | `0x2546BcD3c84621e976D8185a91A922aE77ECEc30` | Eddy Galvan (DEV 3) |
| `JOSECA_WALLET` | `0xbDA5747bFD65F08deb54cb465eB87D40e51B197E` | Joseca (DEV 4) |

---

## 3. Variables del Frontend (`/frontend/.env.local` y `/frontend/.env.example`)

Ubicación: `c:\Altipay\frontend\.env.local`

> [!IMPORTANT]
> En Next.js, cualquier variable que deba ser accesible desde componentes cliente (React Hooks, Wagmi, UI) **DEBE comenzar obligatoriamente con el prefijo `NEXT_PUBLIC_`**. Si no tiene este prefijo, Next.js no la incrustará en el paquete del cliente web.

### Tabla Resumen de Claves (Frontend)

| Variable | Tipo / Formato | Obligatorio | Valor Actual / Recomendado | Propósito |
| :--- | :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_APP_NAME` | String | No | `"AltiPay Protocol"` | Nombre del protocolo mostrado en el modal de conexión de RainbowKit y encabezados. |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | String (UID) | **Sí** | `3a8170812b534d0ff9d794f168fa2d00` | ID de proyecto de Reown / WalletConnect Cloud para conexión de billeteras móviles mediante código QR. |
| `NEXT_PUBLIC_HSK_CHAIN_ID` | Number | **Sí** | `133` | Identificador de cadena de HashKey Chain Testnet. |
| `NEXT_PUBLIC_HSK_RPC_URL` | URL | **Sí** | `https://testnet.hsk.xyz` | RPC utilizado por Wagmi y Viem para consultar el estado en HashKey Testnet. |
| `NEXT_PUBLIC_HSK_ESCROW_ADDRESS` | Ethereum Address | **Sí** | `0xC7d4d9a5708185761DDb65e014a0691C1f99679A` | Dirección del contrato Escrow en HashKey Testnet. |
| `NEXT_PUBLIC_HSK_USDC_ADDRESS` | Ethereum Address | **Sí** | `0xAe9F9d28E0Ba5Ea67dE0F3C82dc7e7215b6c855C` | Dirección del token MockUSDC en HashKey Testnet. |
| `NEXT_PUBLIC_AVALANCHE_FUJI_CHAIN_ID` | Number | **Sí** | `43113` | Identificador de cadena de Avalanche Fuji Testnet. |
| `NEXT_PUBLIC_AVALANCHE_FUJI_RPC_URL` | URL | **Sí** | `https://api.avax-test.network/ext/bc/C/rpc` | RPC utilizado por Wagmi y Viem para Avalanche Fuji. |
| `NEXT_PUBLIC_AVALANCHE_FUJI_ESCROW_ADDRESS`| Ethereum Address | **Sí** | `0xC7d4d9a5708185761DDb65e014a0691C1f99679A` | Dirección del contrato Escrow en Avalanche Fuji. |
| `NEXT_PUBLIC_AVALANCHE_FUJI_USDC_ADDRESS` | Ethereum Address | **Sí** | `0xAe9F9d28E0Ba5Ea67dE0F3C82dc7e7215b6c855C` | Dirección del token MockUSDC en Avalanche Fuji. |

---

### Detalle de cada Variable (Frontend)

#### 1. `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- **Descripción:** ID de proyecto generado en [cloud.reown.com](https://cloud.reown.com/) (antiguo WalletConnect Cloud).
- **Uso en código:** [frontend/config/wagmi.ts](file:///c:/Altipay/frontend/config/wagmi.ts#L25).
- **Consecuencia si falta:** Las billeteras Web3 (como MetaMask Mobile, Rainbow, Trust Wallet) no podrán conectarse mediante escaneo de código QR.

#### 2. `NEXT_PUBLIC_HSK_RPC_URL`
- **Descripción:** Endpoint público para enviar transacciones y llamadas de lectura a la red HashKey Chain Testnet.
- **Uso en código:** [frontend/config/wagmi.ts](file:///c:/Altipay/frontend/config/wagmi.ts#L14).

#### 3. Direcciones de Contratos en Frontend
- Las variables `NEXT_PUBLIC_HSK_ESCROW_ADDRESS`, `NEXT_PUBLIC_HSK_USDC_ADDRESS`, `NEXT_PUBLIC_AVALANCHE_FUJI_ESCROW_ADDRESS` y `NEXT_PUBLIC_AVALANCHE_FUJI_USDC_ADDRESS` sirven como respaldo directo en `.env.local`.
- Adicionalmente, el frontend cuenta con el archivo tipado [frontend/contracts/deployedContracts.ts](file:///c:/Altipay/frontend/contracts/deployedContracts.ts), el cual mapea por `chainId` (`43113`, `133`, `31337`) los contratos y sus ABIs correspondientes.

---

## 4. Matriz de Sincronización (Backend ↔ Frontend)

Para garantizar consistencia absoluta entre lo desplegado por Hardhat y lo consumido por Next.js, AltiPay cuenta con el script automatizado:

```bash
npm run export:artifacts
```

Este script lee las variables del `.env` de la raíz y genera automáticamente el archivo TypeScript sincronizado para el frontend:

| Red / Cadena | Chain ID | Variable en Raíz (`.env`) | Variable en Frontend (`.env.local`) | Configuración en `deployedContracts.ts` |
| :--- | :---: | :--- | :--- | :--- |
| **Avalanche Fuji** | `43113` | `ESCROW_FUJI_ADDRESS`<br>`USDC_FUJI_ADDRESS` | `NEXT_PUBLIC_AVALANCHE_FUJI_ESCROW_ADDRESS`<br>`NEXT_PUBLIC_AVALANCHE_FUJI_USDC_ADDRESS` | `DEPLOYED_CONTRACTS[43113].escrowAddress`<br>`DEPLOYED_CONTRACTS[43113].usdcAddress` |
| **HashKey Testnet** | `133` | `ESCROW_HSK_ADDRESS`<br>`USDC_HSK_ADDRESS` | `NEXT_PUBLIC_HSK_ESCROW_ADDRESS`<br>`NEXT_PUBLIC_HSK_USDC_ADDRESS` | `DEPLOYED_CONTRACTS[133].escrowAddress`<br>`DEPLOYED_CONTRACTS[133].usdcAddress` |
| **Hardhat Local** | `31337` | `ESCROW_LOCAL_ADDRESS`<br>`USDC_LOCAL_ADDRESS` | *(N/A local)* | `DEPLOYED_CONTRACTS[31337].escrowAddress`<br>`DEPLOYED_CONTRACTS[31337].usdcAddress` |

---

## 5. Guía de Configuración Rápida (Paso a Paso)

### Paso 1: Configurar el entorno de Contratos (Raíz)
En la raíz del proyecto (`c:\Altipay`):

```bash
# 1. Copiar la plantilla
cp .env.example .env

# 2. Configurar tu DEPLOYER_PRIVATE_KEY y FEE_RECIPIENT_ADDRESS en el archivo .env
```

### Paso 2: Configurar el entorno del Frontend
En la carpeta `frontend/` (`c:\Altipay\frontend`):

```bash
cd frontend

# 1. Copiar la plantilla
cp .env.example .env.local

# 2. Volver a la raíz
cd ..
```

### Paso 3: Compilar y sincronizar artefactos
```bash
# Compilar contratos con Hardhat
npm run compile

# Exportar ABIs y direcciones hacia el frontend
npm run export:artifacts
```

### Paso 4: Levantar el Frontend
```bash
cd frontend
npm run dev
# Abrir en el navegador: http://localhost:3000
```

---

## 6. Plantillas Listas para Copiar y Pegar

### Bloque 1: `/.env` (Raíz)

Archivo: `c:\Altipay\.env`

```ini
# ==============================================================================
# 🚀 ALTIPAY PROTOCOL — BACKEND & HARDHAT CONFIGURATION (.env)
# ==============================================================================

# Clave privada del deployer (sin prefijo 0x o con 0x)
# ADVERTENCIA: Usar únicamente billeteras de prueba en testnet
DEPLOYER_PRIVATE_KEY=5b3e9e746cd6ca0e632ee79d5c7f70bcb00e647eef0a8dca3921f16cd10010b1

# ------------------------------------------------------------------------------
# 🌐 Endpoints RPC de Redes
# ------------------------------------------------------------------------------
AVALANCHE_FUJI_RPC=https://api.avax-test.network/ext/bc/C/rpc
HSK_TESTNET_RPC=https://testnet.hsk.xyz

# ------------------------------------------------------------------------------
# 🔍 API Keys de Exploradores
# ------------------------------------------------------------------------------
SNOWTRACE_API_KEY=

# ------------------------------------------------------------------------------
# 💼 Parámetros del Protocolo
# ------------------------------------------------------------------------------
# Dirección que recauda el fee del 0.5%
FEE_RECIPIENT_ADDRESS=0x4aBc6cbb4317ecd019aB7889B9B432DDbc8B6476

# Lock de Unlock Protocol (AltiPay VIP 0% fee waiver)
UNLOCK_VIP_LOCK_ADDRESS=0x0000000000000000000000000000000000000000

# ------------------------------------------------------------------------------
# 📍 Contratos Desplegados en Avalanche Fuji (Chain ID 43113)
# ------------------------------------------------------------------------------
ESCROW_FUJI_ADDRESS=0xC7d4d9a5708185761DDb65e014a0691C1f99679A
USDC_FUJI_ADDRESS=0xAe9F9d28E0Ba5Ea67dE0F3C82dc7e7215b6c855C

# ------------------------------------------------------------------------------
# 📍 Contratos Desplegados en HashKey Testnet (Chain ID 133)
# ------------------------------------------------------------------------------
ESCROW_HSK_ADDRESS=0xC7d4d9a5708185761DDb65e014a0691C1f99679A
USDC_HSK_ADDRESS=0xAe9F9d28E0Ba5Ea67dE0F3C82dc7e7215b6c855C

# ------------------------------------------------------------------------------
# 📍 Contratos para Entorno Local Hardhat (Chain ID 31337)
# ------------------------------------------------------------------------------
ESCROW_LOCAL_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
USDC_LOCAL_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# ------------------------------------------------------------------------------
# 👥 Wallets del Equipo para Scripts de Distribución (Mock USDC Faucet)
# ------------------------------------------------------------------------------
JORGE_WALLET=0x9e1D25C3b9e4210B309A4D304aF96085a6B74f7A
EDDY_WALLET=0x2546BcD3c84621e976D8185a91A922aE77ECEc30
JOSECA_WALLET=0xbDA5747bFD65F08deb54cb465eB87D40e51B197E
```

---

### Bloque 2: `/frontend/.env.local` (Frontend)

Archivo: `c:\Altipay\frontend\.env.local`

```ini
# ==============================================================================
# 🌐 ALTIPAY PROTOCOL — FRONTEND NEXT.JS CONFIGURATION (.env.local)
# ==============================================================================

# Nombre público de la aplicación
NEXT_PUBLIC_APP_NAME="AltiPay Protocol"

# Reown / WalletConnect Cloud Project ID (necesario para QR en móviles)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="3a8170812b534d0ff9d794f168fa2d00"

# ------------------------------------------------------------------------------
# 🟡 HashKey Chain Testnet (Chain ID 133)
# ------------------------------------------------------------------------------
NEXT_PUBLIC_HSK_CHAIN_ID=133
NEXT_PUBLIC_HSK_RPC_URL="https://testnet.hsk.xyz"
NEXT_PUBLIC_HSK_ESCROW_ADDRESS="0xC7d4d9a5708185761DDb65e014a0691C1f99679A"
NEXT_PUBLIC_HSK_USDC_ADDRESS="0xAe9F9d28E0Ba5Ea67dE0F3C82dc7e7215b6c855C"

# ------------------------------------------------------------------------------
# 🔴 Avalanche Fuji Testnet (Chain ID 43113)
# ------------------------------------------------------------------------------
NEXT_PUBLIC_AVALANCHE_FUJI_CHAIN_ID=43113
NEXT_PUBLIC_AVALANCHE_FUJI_RPC_URL="https://api.avax-test.network/ext/bc/C/rpc"
NEXT_PUBLIC_AVALANCHE_FUJI_ESCROW_ADDRESS="0xC7d4d9a5708185761DDb65e014a0691C1f99679A"
NEXT_PUBLIC_AVALANCHE_FUJI_USDC_ADDRESS="0xAe9F9d28E0Ba5Ea67dE0F3C82dc7e7215b6c855C"
```

---

## 7. Seguridad y Buenas Prácticas

1. **Protección en Git:**
   - Tanto `/.env` como `/frontend/.env.local` están declarados en sus respectivos archivos `.gitignore`.
   - **NUNCA** ejecutes `git add .env` ni fuerces la inclusión de archivos de entorno con `git add -f`.
2. **Llaves Privadas de Producción:**
   - La clave `DEPLOYER_PRIVATE_KEY` en `.env` debe corresponder únicamente a cuentas de prueba provistas de tokens de faucet en Fuji y HashKey Testnet.
   - Si en el futuro se despliega en Mainnet, se debe utilizar un hardware wallet (Ledger) o un servicio de custodia KMS/Vault.
3. **Exposición en Cliente (`NEXT_PUBLIC_`):**
   - Recuerda que todo valor prefijado con `NEXT_PUBLIC_` es visible por cualquier usuario que inspeccione el código JavaScript en su navegador web.
   - **NUNCA** coloques claves privadas ni secretos de API con el prefijo `NEXT_PUBLIC_`.
