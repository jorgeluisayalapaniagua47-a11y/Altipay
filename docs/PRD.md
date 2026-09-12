# AltiPay Protocol — Product Requirements Document (PRD)

> **Versión:** 1.0.0  
> **Estado:** Especificación MVP — Buildathon Cochabamba 2026 / EAG Global Hackathon  
> **Fecha:** 2026-09-11  
> **Autores:** Equipo AltiPay  

---

## 1. Visión del Producto

**AltiPay Protocol** es una infraestructura PayFi no custodial que resuelve la asimetría de confianza en el comercio mayorista interdepartamental boliviano. Mediante contratos inteligentes de custodia condicional (escrow) sobre stablecoins, AltiPay elimina el riesgo bilateral entre comprador y vendedor en operaciones de encomienda terrestre.

> **IMPORTANTE:** AltiPay NO es un split payment, marketplace de NFTs, plataforma de donaciones, ni clon de Uber/Airbnb. Es estrictamente una **capa de liquidación financiera** (Payment Engine) sobre redes de logística física ya existentes.

---

## 2. Planteamiento del Problema

### 2.1 Contexto del Mercado

El comercio interdepartamental mayorista en Bolivia (La Paz ↔ Santa Cruz ↔ Cochabamba) mueve millones de bolivianos semanales en mercadería, repuestos e insumos vía transporte terrestre. Este ecosistema padece de:

| Problema | Impacto |
|----------|---------|
| **Asimetría de confianza** | El comprador teme pagar sin recibir; el vendedor teme despachar sin cobrar. |
| **Dependencia del efectivo** | Exposición a robos en terminales y oficinas de encomienda. |
| **Devaluación constante** | El crédito comercial en moneda local pierde valor durante el tránsito (3-7 días). |
| **Sin trazabilidad financiera** | Disputas irresolubles por falta de evidencia del pago o entrega. |
| **Informalidad** | ~68% de las transacciones carecen de respaldo contractual alguno. |

### 2.2 Dilema del Comerciante (Pain Point Central)

```
Vendedor (La Paz): "No despacho la carga si no veo el dinero primero."
Comprador (Cochabamba): "No pago si no recibo la mercadería completa."
→ Punto muerto comercial. Operaciones perdidas o ejecutadas con riesgo.
```

### 2.3 Solución Propuesta

AltiPay actúa como un **tercero de confianza algorítmico** que:

1. Inmoviliza el pago del comprador en USDC dentro de un contrato inteligente.
2. Certifica on-chain que los fondos están disponibles para el vendedor.
3. Libera los fondos solo cuando el comprador valida la recepción con un **código secreto criptográfico**.
4. Reembolsa al comprador si el vendedor no despacha dentro del tiempo límite.

---

## 3. Personas de Usuario

### 3.1 Persona Primaria: El Comprador (Doña Carmen)

| Atributo | Detalle |
|----------|---------|
| **Perfil** | Comerciante mayorista, 42 años, Cochabamba |
| **Negocio** | Compra repuestos automotrices desde La Paz |
| **Frecuencia** | 2-3 pedidos semanales, ticket promedio $200-$2,000 USD |
| **Dolor principal** | Ha perdido dinero 3 veces enviando pagos sin recibir mercadería completa |
| **Nivel técnico** | Usa WhatsApp, QR de bancos, billeteras móviles básicas |
| **Motivación** | Proteger su capital y tener prueba irrefutable del pago |

### 3.2 Persona Primaria: El Vendedor (Don Roberto)

| Atributo | Detalle |
|----------|---------|
| **Perfil** | Distribuidor de insumos industriales, 55 años, La Paz |
| **Negocio** | Despacha carga vía flotas terrestres a Cochabamba y Santa Cruz |
| **Frecuencia** | 5-10 despachos semanales |
| **Dolor principal** | Clientes que retiran mercadería y demoran semanas en pagar |
| **Nivel técnico** | Maneja transferencias bancarias y aplicaciones básicas |
| **Motivación** | Garantía irrevocable de que cobrará al momento de la entrega |

### 3.3 Persona Secundaria: El Transportista (Línea de Encomiendas)

| Atributo | Detalle |
|----------|---------|
| **Perfil** | Empresa de transporte terrestre |
| **Rol en AltiPay** | Custodia física de la carga; NO participa en el flujo financiero |
| **Nota** | AltiPay no reemplaza la logística, opera sobre ella |

---

## 4. Requisitos Funcionales (RF)

### RF-01: Creación de Orden de Custodia

| Campo | Especificación |
|-------|---------------|
| **ID** | RF-01 |
| **Nombre** | Fondeo No Custodial |
| **Actor** | Comprador |
| **Descripción** | El comprador crea una orden especificando: dirección wallet del vendedor, monto en USDC, descripción del paquete y tiempo límite de entrega. |
| **Precondición** | Wallet conectada con saldo USDC suficiente. Aprobación previa del token ERC-20 al contrato. |
| **Resultado** | Los fondos se transfieren al contrato inteligente. Se genera un `orderId` único y un `secretHash` (keccak256 del código secreto). |
| **Evento On-Chain** | `OrderCreated(orderId, buyer, seller, amount, secretHash, deadline)` |
| **Prioridad** | P0 — Crítico |

### RF-02: Certificación de Bloqueo de Fondos

| Campo | Especificación |
|-------|---------------|
| **ID** | RF-02 |
| **Nombre** | Certificación de Bloqueo |
| **Actor** | Sistema (contrato) → Vendedor (lectura) |
| **Descripción** | El vendedor puede consultar on-chain que los fondos están bloqueados e irrevocables para una orden específica. |
| **Mecanismo** | Función `getOrder(orderId)` que retorna estado, monto, deadline y participantes. |
| **Evento On-Chain** | El mismo `OrderCreated` sirve como certificación indexable. |
| **Prioridad** | P0 — Crítico |

### RF-03: Liquidación Determinista (Entrega + Liberación)

| Campo | Especificación |
|-------|---------------|
| **ID** | RF-03 |
| **Nombre** | Liquidación Determinista |
| **Actor** | Comprador |
| **Descripción** | Al recibir la carga física, el comprador ingresa el código secreto (preimage). El contrato verifica que `keccak256(secret) == secretHash` y libera el 100% de los fondos al vendedor. |
| **Precondición** | Orden en estado `FUNDED`. Código secreto válido. |
| **Resultado** | Transferencia atómica de USDC al vendedor. Orden marcada como `COMPLETED`. |
| **Evento On-Chain** | `OrderCompleted(orderId, seller, amount)` |
| **Irreversibilidad** | Una vez ejecutada, la liquidación es **permanente e irrevocable**. |
| **Prioridad** | P0 — Crítico |

### RF-04: Mecanismo de Reembolso (Timeout)

| Campo | Especificación |
|-------|---------------|
| **ID** | RF-04 |
| **Nombre** | Reembolso por Expiración |
| **Actor** | Comprador |
| **Descripción** | Si el vendedor no despacha/la entrega no se confirma antes del `deadline`, el comprador puede retirar sus fondos unilateralmente. |
| **Precondición** | `block.timestamp > order.deadline` y orden en estado `FUNDED`. |
| **Resultado** | Devolución completa de USDC al comprador. Orden marcada como `REFUNDED`. |
| **Evento On-Chain** | `OrderRefunded(orderId, buyer, amount)` |
| **Prioridad** | P0 — Crítico |

### RF-05: Confirmación de Despacho por Vendedor

| Campo | Especificación |
|-------|---------------|
| **ID** | RF-05 |
| **Nombre** | Confirmación de Despacho |
| **Actor** | Vendedor |
| **Descripción** | El vendedor marca la orden como despachada, registrando opcionalmente un ID de tracking de la empresa de encomiendas. |
| **Evento On-Chain** | `OrderDispatched(orderId, trackingInfo)` |
| **Prioridad** | P1 — Alto |

### RF-06: Cancelación Mutua

| Campo | Especificación |
|-------|---------------|
| **ID** | RF-06 |
| **Nombre** | Cancelación por Acuerdo |
| **Actor** | Comprador (antes del despacho) |
| **Descripción** | El comprador puede cancelar la orden y recuperar fondos SOLO si el vendedor aún no la ha marcado como despachada. |
| **Prioridad** | P2 — Medio |

---

## 5. Requisitos No Funcionales (RNF)

| ID | Requisito | Especificación | Métrica |
|----|-----------|---------------|---------|
| RNF-01 | **Inmutabilidad** | Sin funciones `admin`, `pause`, `upgrade`, `kill` ni `selfdestruct`. | 0 funciones privilegiadas |
| RNF-02 | **Verificabilidad** | Código fuente verificado en Snowtrace y HSK Explorer. | 100% verified contracts |
| RNF-03 | **Gas Efficiency** | Operaciones optimizadas para L2 y cadenas de bajo costo. | `createOrder` < 150k gas |
| RNF-04 | **Compatibilidad EVM** | Desplegable en cualquier cadena EVM sin modificaciones. | Solidity ^0.8.20 |
| RNF-05 | **UX Latencia** | Confirmación visual de transacción < 15 segundos. | P95 < 15s |
| RNF-06 | **Disponibilidad** | Frontend estático hosteable en IPFS/Vercel, sin backend centralizado. | 99.9% uptime |
| RNF-07 | **Seguridad** | Resistente a reentrancy, overflow, front-running. | Patrón CEI (Checks-Effects-Interactions) |
| RNF-08 | **Privacidad** | El código secreto nunca se almacena on-chain; solo su hash. | Zero-knowledge del secreto pre-revelación |

---

## 6. Cobertura de Tracks y Bounties

### 6.1 Bounty Pollar

| Requisito | Implementación |
|-----------|---------------|
| Problema real demostrable | Custodia comercial para encomiendas interdepartamentales |
| Integración mainnet | Fondeo del escrow vía motor de pagos Pollar con 1 USDC real |
| Transacción demostrable | TX hash verificable en explorador |
| Cero especulación | Sin apuestas, casinos, trading ni memecoins |

### 6.2 HSK Chain Tracks

| Requisito | Implementación |
|-----------|---------------|
| Desplegado en HSK | Contrato de custodia en HSK Testnet |
| Enfoque Payment/DeFi | Máquina de estados de encomienda con liquidación condicional |

### 6.3 Bounty Avalanche

| Requisito | Implementación |
|-----------|---------------|
| Smart contract verificado | Verificación completa en Snowtrace (Fuji Testnet) |
| Caso de uso relevante | Inclusión financiera para comercio mayorista informal |

### 6.4 EAG Global / Devfolio

| Requisito | Implementación |
|-----------|---------------|
| Real-World Ethereum Applications | Solución directa a fricción comercial en economía emergente |
| Economías emergentes | Bolivia — comercio La Paz ↔ Cochabamba ↔ Santa Cruz |

---

## 7. Alcance del MVP

### 7.1 Incluido en MVP (v1.0)

- [x] Contrato inteligente de escrow con máquina de estados
- [x] Interfaz web para crear, fondear, confirmar y reembolsar órdenes
- [x] Soporte multi-chain: Avalanche Fuji + HSK Testnet + Pollar Mainnet
- [x] Conexión de wallet (MetaMask / WalletConnect)
- [x] Generación y validación de código secreto
- [x] Dashboard de órdenes (comprador y vendedor)
- [x] Eventos indexables para notificaciones

### 7.2 Fuera de Alcance (Post-MVP)

- [ ] Integración con APIs de empresas de transporte
- [ ] Sistema de reputación on-chain
- [ ] Soporte multi-token (más allá de USDC)
- [ ] App móvil nativa
- [ ] Oráculos para validación GPS de entrega
- [ ] Gobernanza DAO para disputas
- [ ] Integración fiat on/off ramp

---

## 8. Métricas de Éxito (KPIs)

| KPI | Objetivo MVP | Instrumento |
|-----|-------------|-------------|
| Órdenes creadas en demo | ≥ 5 órdenes end-to-end | Dashboard + Explorador |
| Volumen custodiado | ≥ 10 USDC en demo | Contrato on-chain |
| Tasa de liquidación exitosa | 100% en demo controlada | Logs de eventos |
| Gas por operación | < 200k gas promedio | Etherscan/Snowtrace |
| Tiempo de demo end-to-end | < 3 minutos por flujo completo | Cronómetro en presentación |

---

## 9. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Bug en contrato permite robo de fondos | Media | Crítico | Tests exhaustivos + patrón CEI + auditoría interna |
| USDC no disponible en testnets | Baja | Alto | Desplegar mock ERC-20 para demos |
| Latencia de red en cadenas L2 | Baja | Medio | Timeout configurables + reintentos en frontend |
| Usuario pierde código secreto | Media | Alto | Almacenamiento local cifrado + opción de backup |
| Jurado no entiende el caso de uso | Baja | Alto | Pitch deck con narrativa visual del flujo comercial |

---

## 10. Roadmap de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│  FASE 1: MVP Hackathon (Semana 1-2)                            │
│  ├─ Smart contracts + tests                                     │
│  ├─ Frontend web con flujo completo                             │
│  ├─ Deploy multi-chain (Fuji + HSK + Pollar)                   │
│  └─ Demo end-to-end funcional                                   │
├─────────────────────────────────────────────────────────────────┤
│  FASE 2: Piloto Comercial (Mes 2-3)                            │
│  ├─ Pruebas con 5 comerciantes reales                           │
│  ├─ Integración con 1 empresa de encomiendas                   │
│  ├─ UX refinada con feedback de usuarios                        │
│  └─ Auditoría de seguridad externa                              │
├─────────────────────────────────────────────────────────────────┤
│  FASE 3: Lanzamiento Regional (Mes 4-6)                        │
│  ├─ Deploy en mainnet Avalanche                                 │
│  ├─ App móvil (React Native / PWA)                              │
│  ├─ Sistema de reputación on-chain                              │
│  └─ Expansión a rutas Santa Cruz ↔ Cochabamba                  │
├─────────────────────────────────────────────────────────────────┤
│  FASE 4: Escalamiento (Mes 6-12)                               │
│  ├─ Soporte multi-token + fiat on-ramp                          │
│  ├─ Oráculos de entrega (GPS + IoT)                             │
│  ├─ Gobernanza DAO para disputas                                │
│  └─ Expansión a mercados andinos (Perú, Ecuador)               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. Glosario

| Término | Definición |
|---------|-----------|
| **Escrow** | Custodia condicional de fondos por un tercero (en este caso, un contrato inteligente). |
| **Preimage** | El valor secreto original cuyo hash fue almacenado en el contrato. |
| **HTLC** | Hash Time-Locked Contract — primitiva criptográfica que combina hash-lock y time-lock. |
| **PayFi** | Payment Finance — infraestructura financiera descentralizada enfocada en pagos comerciales. |
| **CEI** | Checks-Effects-Interactions — patrón de seguridad contra reentrancy en Solidity. |
| **Stablecoin** | Token ERC-20 con paridad 1:1 al dólar estadounidense (e.g., USDC). |
| **L2** | Layer 2 — cadenas de segunda capa con menores costos de gas. |
| **No Custodial** | Los fondos están controlados por código, no por una entidad centralizada. |
