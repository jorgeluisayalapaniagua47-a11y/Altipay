# 🎨 Tareas Asignadas: Eddy Galvan (DEV 3 - Frontend UI/UX)

Este documento detalla tus responsabilidades específicas dentro del protocolo AltiPay según la distribución oficial del equipo. Tu enfoque es la **experiencia visual, el diseño mobile-first, la maquetación del landing page y el flujo completo del comprador.**

---

## 📁 Estructura de Archivos (Tu Responsabilidad)

Debes crear y gestionar los siguientes archivos en la estructura del proyecto:

* `tailwind.config.js` y `app/globals.css` (Implementación de tokens de diseño).
* `components/ui/*` (Button, Input, Card, Modal, Badge, Tooltip, Alert).
* `components/layout/Navbar.tsx` y `components/layout/Footer.tsx`.
* `app/page.tsx` (Landing Page comercial AltiPay).
* `app/create/page.tsx` (Página de creación y fondeo de orden de custodia).
* `components/buyer/SecretGeneratorModal.tsx` (Generador del código secreto / PIN con hash `keccak256`).
* `components/buyer/KeypadReleaseModal.tsx` (Teclado numérico táctil mobile-first para ingresar PIN).

---

## 🎯 Tareas de Código a Ejecutar

### 1. Sistema de Diseño y Tokens
* **Paleta AltiPay:** Configurar Indigo primario (`#6366F1`), Verde éxito (`#10B981` para depósitos garantizados), y Slate oscuro para modo nocturno.
* **Tipografía y UI:** Implementar fuentes Inter / Outfit y construir todos los micro-componentes reutilizables de UI.

### 2. Landing Page (`app/page.tsx`)
* **Hero Section:** Diseño de alto impacto con narrativa boliviana: *"Comercio seguro entre La Paz, Cochabamba y Santa Cruz"*.
* **Diagrama Interactivo:** Explicación de 3 pasos (Fondeo ➔ Despacho en Flota ➔ Liberación con PIN).
* **Comparativa:** Sección visual interactiva vs Bancos / Tigo Money / Efectivo.
* **Métricas:** Calculadora de ahorro en comisiones con membresía VIP Unlock.

### 3. Flujo del Comprador (`app/create/page.tsx`)
* **Formulario de Orden:** Crear la vista para iniciar una orden de custodia, con cálculo automático del fee (o 0% si el hook de DEV 2 reporta `isVIP: true`).
* **Módulo de Secreto:** Crear un generador de PIN aleatorio de 6 dígitos. Debe calcular el hash en el cliente y mostrar un modal de advertencia: *"No compartas este código hasta revisar tu mercadería en la terminal"*.

### 4. Componente de Liberación (`components/buyer/KeypadReleaseModal.tsx`)
* **Teclado Táctil:** Crear un keypad táctil estilizado y adaptado para celulares para que el comprador introduzca el PIN y llame a `confirmDeliveryWithSecret`.
* **Micro-animaciones:** Implementar animaciones de éxito (ej. confeti, checkmarks animados) al liberar los fondos.

---

> **Recuerda:** Tu trabajo es la cara visual del protocolo. No te preocupes por la conexión directa a los Smart Contracts; tu compañero DEV 2 te proveerá de *hooks* simplificados (ej. `useCreateOrder()`) que podrás llamar desde tus botones. ¡Mucho éxito en el hackathon!
