# AltiPay Protocol — Escenarios de Aceptación

> **Versión:** 1.0.0  
> **Estado:** Especificación MVP  
> **Fecha:** 2026-09-11  
> **Formato:** Given-When-Then (Gherkin)  

---

## 1. Feature: Creación de Orden de Custodia (RF-01)

### Escenario 1.1: Creación exitosa de orden

```gherkin
Feature: Crear Orden de Custodia

  Scenario: Comprador crea una orden exitosamente
    Given el comprador tiene wallet conectada con 200 USDC de saldo
    And el comprador ha aprobado el contrato AltiPay para gastar 150 USDC
    And la dirección del vendedor es "0x9e1D...4f7A" (válida y diferente al comprador)
    When el comprador crea una orden con:
      | campo        | valor                              |
      | seller       | 0x9e1D...4f7A                      |
      | amount       | 150 USDC                           |
      | description  | Repuestos freno disco Toyota Hilux |
      | deadline     | 72 horas desde ahora               |
      | secretHash   | keccak256(secreto_generado)         |
    Then el contrato transfiere 150 USDC del comprador al escrow
    And se emite el evento OrderCreated con orderId único
    And el estado de la orden es FUNDED
    And el saldo del comprador disminuye en 150 USDC
    And el saldo del contrato aumenta en 150 USDC
    And el frontend muestra el código secreto al comprador
    And el frontend genera un link compartible para el vendedor
```

### Escenario 1.2: Rechazo por saldo insuficiente

```gherkin
  Scenario: Comprador intenta crear orden sin saldo suficiente
    Given el comprador tiene wallet conectada con 50 USDC de saldo
    When el comprador intenta crear una orden por 150 USDC
    Then la transacción revierte con error "ERC20: transfer amount exceeds balance"
    And no se crea ninguna orden
    And el frontend muestra "Saldo insuficiente. Necesitas 150 USDC."
```

### Escenario 1.3: Rechazo por falta de aprobación ERC-20

```gherkin
  Scenario: Comprador no ha aprobado el gasto de USDC
    Given el comprador tiene 200 USDC pero NO ha aprobado el contrato
    When el comprador intenta crear una orden por 150 USDC
    Then la transacción revierte con error "ERC20: insufficient allowance"
    And el frontend muestra botón "Aprobar USDC" antes de "Fondear Custodia"
```

### Escenario 1.4: Rechazo por dirección de vendedor inválida

```gherkin
  Scenario: Comprador ingresa su propia dirección como vendedor
    Given el comprador está conectado con dirección "0x7a3F...8b2C"
    When el comprador ingresa "0x7a3F...8b2C" como dirección del vendedor
    Then la transacción revierte con error "Buyer cannot be seller"
    And el frontend muestra "No puedes crear una orden para ti mismo"
```

### Escenario 1.5: Rechazo por monto cero

```gherkin
  Scenario: Comprador intenta crear orden con monto cero
    Given el comprador tiene wallet conectada
    When el comprador intenta crear una orden con monto 0 USDC
    Then la transacción revierte con error "Amount must be > 0"
    And el frontend valida el campo antes de enviar la transacción
```

### Escenario 1.6: Rechazo por deadline en el pasado

```gherkin
  Scenario: Comprador ingresa un deadline ya vencido
    Given la hora actual es 2026-09-15T10:00:00Z
    When el comprador crea una orden con deadline 2026-09-14T10:00:00Z
    Then la transacción revierte con error "Deadline must be in the future"
```

---

## 2. Feature: Certificación de Bloqueo de Fondos (RF-02)

### Escenario 2.1: Vendedor verifica fondos bloqueados

```gherkin
Feature: Verificar Fondos Bloqueados

  Scenario: Vendedor consulta una orden existente
    Given existe una orden #A7K9 con 150 USDC en estado FUNDED
    And el vendedor "0x9e1D...4f7A" está registrado como seller de esa orden
    When el vendedor consulta getOrder(orderId)
    Then el sistema retorna:
      | campo    | valor                  |
      | status   | FUNDED                 |
      | amount   | 150000000 (6 decimales)|
      | buyer    | 0x7a3F...8b2C          |
      | seller   | 0x9e1D...4f7A          |
      | deadline | 1726488000             |
    And el frontend muestra "✅ Fondos verificados: 150.00 USDC bloqueados"
    And el frontend muestra link al explorador de bloques con la TX de creación
```

### Escenario 2.2: Consulta de orden inexistente

```gherkin
  Scenario: Consulta con orderId inválido
    Given no existe ninguna orden con id "0xabcd..."
    When alguien consulta getOrder("0xabcd...")
    Then el sistema retorna status = NONE (0)
    And el frontend muestra "Orden no encontrada"
```

---

## 3. Feature: Confirmación de Despacho (RF-05)

### Escenario 3.1: Vendedor confirma despacho exitosamente

```gherkin
Feature: Confirmar Despacho de Carga

  Scenario: Vendedor marca la orden como despachada
    Given existe una orden #A7K9 en estado FUNDED
    And el vendedor conectado es "0x9e1D...4f7A" (asignado a la orden)
    When el vendedor llama a confirmDispatch(orderId, "FLOTA-COPACABANA-2847")
    Then el estado cambia de FUNDED a DISPATCHED
    And se emite el evento OrderDispatched(orderId, "FLOTA-COPACABANA-2847")
    And el frontend del comprador muestra "🚚 Tu pedido fue despachado"
    And se muestra el tracking info "FLOTA-COPACABANA-2847"
```

### Escenario 3.2: Rechazo — Actor no autorizado

```gherkin
  Scenario: Un tercero intenta confirmar despacho
    Given existe una orden #A7K9 en estado FUNDED
    And la wallet conectada NO es el vendedor asignado
    When el tercero intenta llamar a confirmDispatch(orderId)
    Then la transacción revierte con error "Only seller can dispatch"
```

### Escenario 3.3: Rechazo — Estado inválido

```gherkin
  Scenario: Vendedor intenta despachar una orden ya completada
    Given existe una orden #A7K9 en estado COMPLETED
    When el vendedor intenta llamar a confirmDispatch(orderId)
    Then la transacción revierte con error "Order not in valid state"
```

---

## 4. Feature: Liquidación Determinista (RF-03)

### Escenario 4.1: Confirmación de entrega exitosa

```gherkin
Feature: Confirmar Entrega y Liberar Fondos

  Scenario: Comprador confirma recepción con código correcto
    Given existe una orden #A7K9 con 150 USDC en estado DISPATCHED
    And el secretHash almacenado es keccak256("ALTI7K9MX3PQ")
    And el comprador conectado es "0x7a3F...8b2C"
    When el comprador llama a confirmDelivery(orderId, "ALTI7K9MX3PQ")
    Then el contrato verifica que keccak256("ALTI7K9MX3PQ") == secretHash
    And la verificación es exitosa
    And se transfieren 150 USDC del contrato al vendedor "0x9e1D...4f7A"
    And el estado cambia a COMPLETED
    And se registra completedAt = block.timestamp
    And se emite evento OrderCompleted(orderId, seller, 150000000)
    And el saldo del vendedor aumenta en 150 USDC
    And el saldo del contrato disminuye en 150 USDC
    And el frontend muestra "✅ Fondos liberados exitosamente"
```

### Escenario 4.2: Rechazo por código secreto incorrecto

```gherkin
  Scenario: Comprador ingresa código secreto incorrecto
    Given existe una orden #A7K9 en estado DISPATCHED
    And el secretHash almacenado es keccak256("ALTI7K9MX3PQ")
    When el comprador llama a confirmDelivery(orderId, "CODIGO_ERRONEO")
    Then el contrato verifica que keccak256("CODIGO_ERRONEO") != secretHash
    And la transacción revierte con error "Invalid secret"
    And los fondos permanecen en el contrato
    And el estado permanece como DISPATCHED
    And el frontend muestra "❌ Código incorrecto. Intenta nuevamente."
```

### Escenario 4.3: Rechazo — Solo el comprador puede confirmar

```gherkin
  Scenario: Vendedor intenta confirmar la entrega (auto-liberación)
    Given existe una orden #A7K9 en estado DISPATCHED
    And la wallet conectada es el vendedor (no el comprador)
    When el vendedor intenta llamar a confirmDelivery(orderId, secret)
    Then la transacción revierte con error "Only buyer can confirm"
    And los fondos permanecen bloqueados
```

### Escenario 4.4: Confirmación en estado FUNDED (sin despacho previo)

```gherkin
  Scenario: Comprador confirma entrega sin que el vendedor haya despachado
    Given existe una orden #A7K9 en estado FUNDED (no despachada aún)
    And el comprador tiene el código secreto correcto
    When el comprador llama a confirmDelivery(orderId, secret)
    Then la transacción se ejecuta exitosamente
    And los fondos se liberan al vendedor
    And el estado cambia a COMPLETED
    Note: El comprador puede liberar fondos en cualquier momento pre-deadline
          si decide confiar sin esperar el despacho formal
```

---

## 5. Feature: Reembolso por Expiración (RF-04)

### Escenario 5.1: Reembolso exitoso post-deadline

```gherkin
Feature: Reclamar Reembolso por Timeout

  Scenario: Comprador reclama reembolso después del deadline
    Given existe una orden #A7K9 con 150 USDC en estado FUNDED
    And el deadline de la orden es 2026-09-15T14:00:00Z
    And la hora actual del bloque es 2026-09-15T14:00:01Z (1 segundo después)
    When el comprador llama a claimRefund(orderId)
    Then se transfieren 150 USDC del contrato al comprador
    And el estado cambia a REFUNDED
    And se registra completedAt = block.timestamp
    And se emite evento OrderRefunded(orderId, buyer, 150000000)
    And el frontend muestra "💰 Reembolso procesado: 150.00 USDC devueltos"
```

### Escenario 5.2: Rechazo — Deadline no alcanzado

```gherkin
  Scenario: Comprador intenta reembolso antes del deadline
    Given existe una orden #A7K9 en estado FUNDED
    And el deadline de la orden es 2026-09-15T14:00:00Z
    And la hora actual del bloque es 2026-09-14T10:00:00Z (aún no vence)
    When el comprador llama a claimRefund(orderId)
    Then la transacción revierte con error "Deadline not reached"
    And los fondos permanecen en el contrato
    And el frontend muestra "⏳ El deadline no ha expirado. Faltan 28 horas."
```

### Escenario 5.3: Rechazo — Solo el comprador puede reembolsar

```gherkin
  Scenario: Vendedor intenta reclamar reembolso de su propia orden
    Given existe una orden #A7K9 post-deadline
    And la wallet conectada es el vendedor (no el comprador)
    When el vendedor intenta llamar a claimRefund(orderId)
    Then la transacción revierte con error "Only buyer can refund"
```

### Escenario 5.4: Reembolso de orden despachada pero expirada

```gherkin
  Scenario: Orden despachada pero el deadline expiró sin confirmación
    Given existe una orden #A7K9 en estado DISPATCHED
    And el deadline expiró hace 2 días
    And el comprador nunca ingresó el código secreto
    When el comprador llama a claimRefund(orderId)
    Then se transfieren 150 USDC del contrato al comprador
    And el estado cambia a REFUNDED
    Note: Protege al comprador si la carga se perdió en tránsito
```

---

## 6. Feature: Cancelación de Orden (RF-06)

### Escenario 6.1: Cancelación exitosa pre-despacho

```gherkin
Feature: Cancelar Orden

  Scenario: Comprador cancela antes del despacho
    Given existe una orden #A7K9 en estado FUNDED
    And el vendedor NO ha confirmado despacho
    When el comprador llama a cancelOrder(orderId)
    Then se devuelven 150 USDC al comprador
    And el estado cambia a CANCELLED
    And se emite evento OrderCancelled(orderId, buyer, 150000000)
    And el frontend muestra "Orden cancelada. Fondos devueltos."
```

### Escenario 6.2: Rechazo — Cancelación post-despacho

```gherkin
  Scenario: Comprador intenta cancelar después del despacho
    Given existe una orden #A7K9 en estado DISPATCHED
    When el comprador intenta llamar a cancelOrder(orderId)
    Then la transacción revierte con error "Cannot cancel dispatched order"
    And el frontend muestra "No puedes cancelar. La carga ya fue despachada."
    And se ofrece la opción de esperar el deadline para reembolso
```

---

## 7. Feature: Conexión de Wallet

### Escenario 7.1: Conexión exitosa con MetaMask

```gherkin
Feature: Conectar Wallet

  Scenario: Usuario conecta MetaMask exitosamente
    Given el usuario tiene MetaMask instalado con la red Avalanche Fuji configurada
    When el usuario hace clic en "Conectar Wallet"
    And selecciona MetaMask del modal de opciones
    And aprueba la conexión en MetaMask
    Then el frontend muestra la dirección truncada "0x7a3F...8b2C"
    And muestra el saldo de USDC en la red seleccionada
    And habilita las opciones de crear orden y ver dashboard
```

### Escenario 7.2: Red incorrecta

```gherkin
  Scenario: Usuario conectado a red no soportada
    Given el usuario tiene MetaMask conectado a Ethereum Mainnet
    And AltiPay soporta solo Avalanche Fuji y HSK Testnet
    When el usuario intenta interactuar con el protocolo
    Then el frontend muestra "Red no soportada"
    And ofrece botón "Cambiar a Avalanche Fuji"
    And al hacer clic, solicita automáticamente el switch de red en MetaMask
```

---

## 8. Feature: Dashboard de Órdenes

### Escenario 8.1: Vista de órdenes como comprador

```gherkin
Feature: Dashboard de Órdenes

  Scenario: Comprador ve sus órdenes activas
    Given el comprador "0x7a3F...8b2C" tiene:
      | orderId | status     | amount   | seller        |
      | #A7K9   | FUNDED     | 150 USDC | 0x9e1D...4f7A |
      | #B3M2   | DISPATCHED | 80 USDC  | 0x5c2E...1a3B |
      | #C1P5   | COMPLETED  | 200 USDC | 0x3b7A...9d6F |
    When el comprador accede al dashboard
    Then ve 3 órdenes ordenadas por fecha (más reciente primero)
    And las órdenes activas (#A7K9, #B3M2) se muestran con acciones disponibles
    And la orden completada (#C1P5) se muestra con badge ✅
    And puede filtrar por estado (Todos, Activas, Completadas, Reembolsadas)
```

### Escenario 8.2: Dashboard vacío

```gherkin
  Scenario: Usuario nuevo sin órdenes
    Given el usuario "0x1234...5678" no tiene ninguna orden
    When accede al dashboard
    Then ve un estado vacío con mensaje "Aún no tienes órdenes"
    And un botón CTA "Crear tu primera orden de custodia"
```

---

## 9. Feature: Seguridad del Contrato

### Escenario 9.1: Resistencia a reentrancy

```gherkin
Feature: Seguridad del Contrato

  Scenario: Intento de ataque de reentrancy en confirmDelivery
    Given un contrato malicioso intenta re-entrar durante la transferencia
    When el contrato malicioso llama a confirmDelivery
    Then el estado se actualiza a COMPLETED ANTES de la transferencia (CEI)
    And cualquier re-entrada falla porque el estado ya no es DISPATCHED
    And los fondos se transfieren correctamente una sola vez
```

### Escenario 9.2: Sin funciones administrativas

```gherkin
  Scenario: No existen funciones privilegiadas
    Given el contrato AltiPay está desplegado
    Then no existe ninguna función con modificador onlyOwner
    And no existe función pause() o unpause()
    And no existe función upgrade() o migrate()
    And no existe función selfdestruct() o kill()
    And no existe función withdrawAll() o emergencyWithdraw()
    And el contrato es completamente autónomo e inmutable
```

### Escenario 9.3: Protección contra front-running

```gherkin
  Scenario: Front-runner intercepta el secreto en el mempool
    Given un front-runner observa una transacción pendiente con el secreto
    And el front-runner intenta llamar confirmDelivery con el mismo secreto
    When la transacción del front-runner se ejecuta primero
    Then la transacción revierte porque msg.sender != order.buyer
    And solo el comprador original puede confirmar la entrega
    And los fondos llegan correctamente al vendedor legítimo
```

---

## 10. Feature: Multi-Chain

### Escenario 10.1: Operación en Avalanche Fuji

```gherkin
Feature: Soporte Multi-Chain

  Scenario: Crear orden en Avalanche Fuji
    Given el usuario está conectado a Avalanche Fuji (chainId: 43113)
    And el contrato AltiPay está desplegado en Fuji
    And el mock USDC está disponible en Fuji
    When el comprador crea una orden
    Then la transacción se confirma en ~2 segundos
    And el orderId incluye chainId 43113 para unicidad cross-chain
    And el link al explorador apunta a testnet.snowtrace.io
```

### Escenario 10.2: Operación en HSK Testnet

```gherkin
  Scenario: Crear orden en HSK Testnet
    Given el usuario está conectado a HSK Testnet
    And el contrato AltiPay está desplegado en HSK
    When el comprador crea una orden
    Then la transacción se confirma exitosamente
    And el link al explorador apunta a HSK Explorer
```

---

## 11. Matriz de Trazabilidad

| Escenario | Requisito | Prioridad | Estado |
|-----------|-----------|-----------|--------|
| 1.1 - 1.6 | RF-01 (Fondeo) | P0 | Pendiente |
| 2.1 - 2.2 | RF-02 (Certificación) | P0 | Pendiente |
| 3.1 - 3.3 | RF-05 (Despacho) | P1 | Pendiente |
| 4.1 - 4.4 | RF-03 (Liquidación) | P0 | Pendiente |
| 5.1 - 5.4 | RF-04 (Reembolso) | P0 | Pendiente |
| 6.1 - 6.2 | RF-06 (Cancelación) | P2 | Pendiente |
| 7.1 - 7.2 | RNF (UX/Wallet) | P1 | Pendiente |
| 8.1 - 8.2 | RNF (Dashboard) | P1 | Pendiente |
| 9.1 - 9.3 | RNF (Seguridad) | P0 | Pendiente |
| 10.1 - 10.2 | RNF (Multi-chain) | P1 | Pendiente |
