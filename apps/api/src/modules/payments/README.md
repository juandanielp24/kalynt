# Payments Module

Módulo de gestión de pagos con soporte para múltiples métodos de pago, principalmente Mercado Pago.

## <¯ Features

-  Pagos en efectivo (aprobación inmediata)
-  Integración Mercado Pago (tarjetas, QR, links)
-  QR codes para pagos presenciales
-  Links de pago compartibles
-  Webhooks para notificaciones de estado
-  Reembolsos
- ó Pagos con MODO (próximamente)
- ó Transferencias bancarias (próximamente)

## =æ Setup

### 1. Credenciales de Mercado Pago

**Testing (Sandbox):**
1. Ir a: https://www.mercadopago.com.ar/developers/panel
2. Crear una aplicación de prueba
3. Copiar credenciales de TEST

**Producción:**
1. Completar el formulario de homologación
2. Obtener credenciales de producción
3. Configurar certificado SSL válido

### 2. Variables de Entorno
```env
# Testing
MERCADO_PAGO_ACCESS_TOKEN=TEST-xxxxx
MERCADO_PAGO_PUBLIC_KEY=TEST-xxxxx
MERCADO_PAGO_WEBHOOK_SECRET=your-secret
MERCADO_PAGO_WEBHOOK_URL=https://your-api.com/api/v1/payments/webhooks/mercadopago

# Producción
# MERCADO_PAGO_ACCESS_TOKEN=APP_USR-xxxxx
# MERCADO_PAGO_PUBLIC_KEY=APP_USR-xxxxx
```

### 3. Configurar Webhooks

Para testing local con ngrok:
```bash
./scripts/setup-webhook-tunnel.sh
```

Para producción:
1. Usar URL pública con HTTPS
2. Configurar en Mercado Pago Dashboard ’ Webhooks
3. Eventos a suscribir: `payment`

## =€ Uso

### Pago en Efectivo
```typescript
const payment = await paymentsService.createPayment(tenantId, {
  saleId: 'sale-id',
  method: PaymentMethod.CASH,
  amountCents: 100000, // $1000
});

// Aprobado inmediatamente
console.log(payment.status); // 'approved'
```

### Pago con Mercado Pago (QR)
```typescript
const payment = await paymentsService.createPayment(tenantId, {
  saleId: 'sale-id',
  method: PaymentMethod.QR_CODE,
  amountCents: 100000,
  customerEmail: 'customer@example.com',
});

// Mostrar QR al cliente
const qrCode = payment.qrCode; // Base64 image
```

### Link de Pago
```typescript
const { paymentUrl } = await paymentsService.generatePaymentLink(
  tenantId,
  saleId
);

// Compartir link con el cliente
console.log(paymentUrl); // https://mpago.la/xxxxx
```

### Verificar Estado
```typescript
const payment = await paymentsService.getPaymentStatus(tenantId, paymentId);
console.log(payment.status); // 'approved', 'pending', etc.
```

### Reembolso
```typescript
await paymentsService.refundPayment(
  tenantId,
  paymentId,
  500 // Opcional: monto parcial en pesos
);
```

## = Webhooks

El endpoint de webhooks recibe notificaciones de Mercado Pago cuando cambia el estado de un pago.

**Endpoint:** `POST /api/v1/payments/webhooks/mercadopago`

**Flujo:**
1. MP envía notificación ’ Webhook
2. Webhook consulta estado del pago en MP
3. Actualiza estado en la DB
4. Si está aprobado, marca la venta como completada

**Testing:**
```bash
curl -X POST http://localhost:3001/api/v1/payments/webhooks/mercadopago/test
```

## >ê Testing
```bash
# Unit tests
pnpm test payments

# Integration tests
pnpm test:e2e payments

# Manual testing
TOKEN=xxx TENANT_ID=yyy ./scripts/test-mercadopago.sh
```

## =Ê Estados de Pago

| Estado | Descripción |
|--------|-------------|
| `pending` | Pago iniciado, esperando confirmación |
| `approved` | Pago aprobado exitosamente |
| `in_process` | Pago en proceso (ej: boleto pendiente) |
| `rejected` | Pago rechazado |
| `cancelled` | Pago cancelado |
| `refunded` | Pago reembolsado |

## =' Troubleshooting

### Webhook no recibe notificaciones

1. Verificar que la URL es HTTPS (obligatorio en producción)
2. Verificar que está configurada en MP Dashboard
3. Revisar logs del servidor
4. Usar ngrok para testing local

### Pago rechazado

- Verificar saldo en cuenta de prueba
- Usar tarjetas de testing válidas
- Revisar detalles del error en `payment.error`

### QR no genera

- Verificar que tienes Point of Sale habilitado en MP
- Verificar credenciales
- Revisar logs del servidor

## = Seguridad

-  Verificación de firma en webhooks
-  Validación de tenant en todas las operaciones
-  No exponer access tokens al frontend
-  HTTPS obligatorio en producción

## =Ú Referencias

- [Mercado Pago Docs](https://www.mercadopago.com.ar/developers)
- [SDK Node.js](https://github.com/mercadopago/sdk-nodejs)
- [Webhooks Guide](https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks)
- [Testing Cards](https://www.mercadopago.com.ar/developers/es/docs/your-integrations/test/cards)

## =ã Roadmap

- [ ] Pagos con MODO
- [ ] Pagos recurrentes/suscripciones
- [ ] Split payments (marketplace)
- [ ] Apple Pay / Google Pay
- [ ] Pagos con criptomonedas
