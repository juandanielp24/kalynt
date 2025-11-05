# Notifications Module

Sistema completo de notificaciones multicanal con emails, SMS, push y WebSockets.

## 🎯 Features

- ✅ **Email Transaccional**: Nodemailer con templates Handlebars
- ✅ **SMS**: Integración con Twilio
- ✅ **Push Notifications**: Firebase Cloud Messaging (FCM)
- ✅ **In-App Real-time**: WebSockets con Socket.IO
- ✅ **Queue System**: Bull para procesamiento asíncrono
- ✅ **Templates**: Sistema flexible con Handlebars
- ✅ **Preferencias**: Control granular por usuario
- ✅ **Email Tracking**: Aperturas y clicks (próximamente)

## 📋 Tabla de Contenidos

- [Arquitectura](#arquitectura)
- [Setup](#setup)
- [Email Templates](#email-templates)
- [WebSockets](#websockets)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## 🏗️ Arquitectura

```
┌─────────────────┐
│   Client App    │
└────────┬────────┘
         │
    ┌────┴────┐
    │ Socket  │ (Real-time)
    │   or    │
    │ HTTP    │ (Polling)
    └────┬────┘
         │
┌────────┴────────────┐
│  Notifications      │
│  Service            │
└─────────┬───────────┘
          │
    ┌─────┴──────┐
    │            │
┌───┴───┐  ┌────┴────┐
│ Queue │  │ Socket  │
│ Jobs  │  │ Gateway │
└───┬───┘  └────┬────┘
    │           │
┌───┴──────┐ ┌──┴───┐
│ Workers  │ │ Emit │
│ - Email  │ │ Event│
│ - SMS    │ └──────┘
│ - Push   │
└──────────┘
```

## 🚀 Setup

### 1. Instalar Dependencias

```bash
cd apps/api
pnpm add nodemailer @nestjs-modules/mailer handlebars
pnpm add @nestjs/bull bull
pnpm add @nestjs/websockets @nestjs/platform-socket.io socket.io
pnpm add twilio firebase-admin
```

### 2. Variables de Entorno

```env
# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_NAME=Retail Super App
SMTP_FROM_EMAIL=noreply@retailsuperapp.com

# Twilio (SMS)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890

# Firebase (Push)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Redis (Bull Queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Redis Setup

```bash
# Docker
docker run -d --name redis -p 6379:6379 redis:7-alpine

# O usando docker-compose
# Ver docker-compose.yml en la raíz del proyecto
```

### 4. Database Migration

```bash
pnpm --filter @retail/database db:migrate
```

## 📧 Email Templates

### Estructura de Templates

```
apps/api/src/notifications/templates/
├── layouts/
│   └── base.hbs          # Layout principal
├── welcome.hbs           # Bienvenida
├── invoice.hbs           # Facturas
├── password-reset.hbs    # Reset contraseña
├── low-stock-alert.hbs   # Alertas de stock
└── daily-summary.hbs     # Resumen diario
```

### Crear Nuevo Template

1. **Crear archivo HBS**:

```handlebars
<!-- templates/my-template.hbs -->
<h2>Hola {{name}}</h2>
<p>{{message}}</p>
<p style="text-align: center;">
  <a href="{{actionUrl}}" class="button">Acción</a>
</p>
```

2. **Enviar email**:

```typescript
await notificationsService.sendEmail({
  to: 'user@example.com',
  subject: 'Mi Template',
  template: 'my-template',
  context: {
    name: 'Juan',
    message: 'Este es el mensaje',
    actionUrl: 'https://...',
  },
});
```

### Handlebars Helpers

Helpers disponibles:

- `{{formatDate date 'dd/MM/yyyy'}}`
- `{{formatCurrency cents}}`
- `{{formatNumber value minimumFractionDigits=2}}`
- `{{year}}`

## 🔌 WebSockets

### Cliente (Frontend)

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001/notifications', {
  auth: { token: authToken },
});

socket.on('connect', () => {
  console.log('Connected');
});

socket.on('notification', (notification) => {
  console.log('New notification:', notification);
  // Mostrar toast, actualizar UI, etc.
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});
```

### Servidor (Backend)

```typescript
// Enviar a usuario específico
notificationsGateway.sendToUser(userId, 'notification', data);

// Enviar a todos en tenant
notificationsGateway.sendToTenant(tenantId, 'notification', data);

// Broadcast a todos
notificationsGateway.broadcast('notification', data);
```

## 📡 API Endpoints

### GET /notifications

Obtener notificaciones del usuario.

**Query Params:**

- `unreadOnly`: boolean
- `limit`: number (default: 50)
- `offset`: number (default: 0)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "notif-1",
      "type": "low_stock",
      "title": "Stock Bajo",
      "message": "Producto X tiene stock bajo",
      "read": false,
      "createdAt": "2024-01-01T10:00:00Z"
    }
  ]
}
```

### GET /notifications/unread-count

Obtener cantidad de notificaciones sin leer.

### PATCH /notifications/:id/read

Marcar notificación como leída.

### POST /notifications/mark-all-read

Marcar todas las notificaciones como leídas.

### DELETE /notifications/:id

Eliminar notificación.

### GET /notifications/preferences

Obtener preferencias de notificaciones.

### PATCH /notifications/preferences

Actualizar preferencias.

**Body:**

```json
{
  "emailEnabled": true,
  "smsEnabled": false,
  "pushEnabled": true,
  "inAppEnabled": true
}
```

## 🧪 Testing

### Unit Tests

```bash
# Backend
pnpm test notifications.service
pnpm test email.processor

# Frontend
pnpm test NotificationsBell
pnpm test NotificationsList
```

### E2E Tests

```bash
pnpm test:e2e notifications/notifications-flow
```

### Manual Testing

**Test Email:**

```bash
curl -X POST http://localhost:3001/api/v1/notifications/test-email \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"template": "welcome"}'
```

**Test WebSocket:**

```javascript
// En la consola del navegador
const socket = io('http://localhost:3001/notifications', {
  auth: { token: 'YOUR_TOKEN' },
});
socket.on('notification', console.log);
```

## 🐛 Troubleshooting

### Emails no se envían

**Problema:** Los emails no llegan.

**Soluciones:**

1. Verificar credenciales SMTP:

```bash
# Test SMTP connection
node -e "require('nodemailer').createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: { user: 'YOUR_EMAIL', pass: 'YOUR_PASSWORD' }
}).verify((error, success) => console.log(error || 'OK'))"
```

2. Revisar logs de Bull:

```bash
# Ver jobs fallidos
docker exec -it redis redis-cli
LRANGE bull:email:failed 0 -1
```

3. Verificar templates:
   - Comprobar que el archivo `.hbs` existe
   - Verificar sintaxis Handlebars
   - Revisar helpers registrados

### WebSocket no conecta

**Problema:** Cliente no puede conectar al WebSocket.

**Soluciones:**

1. Verificar CORS:

```typescript
// apps/api/src/main.ts
app.enableCors({
  origin: process.env.NEXT_PUBLIC_APP_URL,
  credentials: true,
});
```

2. Verificar token:

```typescript
// El token debe ser válido JWT
const token = localStorage.getItem('auth_token');
console.log('Token:', token);
```

3. Revisar namespace:

```typescript
// Asegurarse de usar el namespace correcto
io('http://localhost:3001/notifications'); // ✓
io('http://localhost:3001'); // ✗
```

### SMS no se envían

**Problema:** Los SMS no llegan.

**Soluciones:**

1. Verificar cuenta Twilio activa
2. Verificar formato de número: `+[country code][number]`
3. Verificar saldo en Twilio
4. Revisar logs:

```bash
pnpm logs | grep "SMS"
```

### Push notifications no funcionan

**Problema:** Las notificaciones push no llegan.

**Soluciones:**

1. Verificar Firebase config:

```bash
echo $FIREBASE_SERVICE_ACCOUNT | jq
```

2. Verificar tokens registrados:

```sql
SELECT * FROM device_tokens WHERE user_id = 'USER_ID' AND is_active = true;
```

3. Verificar permisos de notificaciones en el dispositivo

## 📊 Monitoring

### Bull Queue Dashboard

```bash
# Instalar Bull Board
pnpm add @bull-board/api @bull-board/express

# Acceder a http://localhost:3001/admin/queues
```

### Logs

```bash
# Ver logs en tiempo real
pnpm logs

# Filtrar por notificaciones
pnpm logs | grep "Notification"

# Ver errores
pnpm logs | grep "ERROR"
```

### Métricas

- Emails enviados/fallidos
- SMS enviados/fallidos
- Push enviados/fallidos
- Usuarios conectados al WebSocket
- Tiempo promedio de procesamiento

## 🔒 Security

### Best Practices

1. **Never expose credentials**: Usa variables de entorno
2. **Validate inputs**: Sanitiza emails, números de teléfono
3. **Rate limiting**: Limita envíos por usuario/tenant
4. **Token validation**: Valida JWT en WebSocket
5. **HTTPS only**: En producción, usa HTTPS

### Rate Limiting

```typescript
// Ejemplo: Max 10 emails por minuto por usuario
@Throttle(10, 60)
@Post('send-email')
async sendEmail() { }
```

## 🚀 Production Checklist

- [ ] Variables de entorno configuradas
- [ ] Redis en alta disponibilidad
- [ ] SMTP relay configurado (e.g., SendGrid, AWS SES)
- [ ] Twilio account en modo producción
- [ ] Firebase configurado para producción
- [ ] WebSocket con HTTPS/WSS
- [ ] Rate limiting habilitado
- [ ] Monitoring y alertas configurados
- [ ] Logs centralizados (e.g., CloudWatch, Datadog)
- [ ] Email templates testeados
- [ ] Fallbacks configurados
