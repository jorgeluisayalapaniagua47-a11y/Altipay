import { test, expect } from '@playwright/test';

test.describe('AltiPay Protocol E2E - Flujo del Vendedor', () => {
  
  test('Dashboard carga y muestra órdenes de forma segura', async ({ page }) => {
    // 1. Vendedor entra a su dashboard
    await page.goto('/seller');
    
    // Verifica que la UI carga y muestra el mensaje de confianza
    await expect(page.getByText('Depósito Bloqueado y Garantizado')).toBeVisible();
    await expect(page.getByText('Tus Ventas')).toBeVisible();
  });

  test('Vendedor despacha orden fondeada', async ({ page }) => {
    await page.goto('/seller');

    // 2. Busca la orden en estado "Fondeado" (ALT-8918)
    const orderCard = page.locator('article').filter({ hasText: 'ALT-8918' });
    await expect(orderCard).toBeVisible();
    
    // Verifica que el estado de la orden indique Fondeado
    await expect(orderCard.getByText('Fondeado')).toBeVisible();

    // 3. Vendedor hace clic en "Despachar Carga"
    await orderCard.getByRole('button', { name: 'Despachar Carga' }).click();

    // 4. Modal de despacho se abre
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('Confirmar Despacho')).toBeVisible();
    
    // 5. Vendedor ingresa información de seguimiento
    const input = page.getByPlaceholder('Ej. Flota Bolívar #84920');
    await input.fill('Flota Copacabana #1234');
    
    // 6. Vendedor confirma
    const submitBtn = modal.getByRole('button', { name: 'Marcar como despachado' });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();
    
    // 7. Notificación de éxito y cambio de estado
    await expect(page.getByRole('status').filter({ hasText: 'marcada como despachada' })).toBeVisible();
    await expect(orderCard.getByText('En tránsito: Flota Copacabana #1234')).toBeVisible();
  });

  test('Vista Pública de Tracking (Timeline)', async ({ page }) => {
    // Comprador o chofer entra a ver el estado de la orden despachada previamente (ej. ALT-8924)
    await page.goto('/order/ALT-8924');
    
    await expect(page.getByText('Detalle de Envío')).toBeVisible();
    
    // Verifica que el stepper está en progreso
    await expect(page.getByText('Progreso de la Orden')).toBeVisible();
    await expect(page.getByText('Flota Bolívar #48291')).toBeVisible();
    
    // Verifica que muestra el ID de la orden en blockchain
    await expect(page.getByText('ALT-8924')).toBeVisible();
  });

  test('API Route expone metadatos de la orden', async ({ request }) => {
    // Simulamos que una red social (WhatsApp, Twitter) consulta los metadatos open graph
    const response = await request.get('/api/orders/ALT-8924');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.id).toBe('ALT-8924');
    expect(data.status).toBe(2); // DISPATCHED
    expect(data.trackingInfo).toBe('Flota Bolívar #48291');
  });
});
