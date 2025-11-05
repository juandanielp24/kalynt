# Setup de Proveedores de Notificaciones

## Gmail (Email)

### 1. Crear App Password

1. Ir a https://myaccount.google.com/security
2. Habilitar verificación en 2 pasos
3. Ir a "Contraseñas de aplicaciones"
4. Generar nueva contraseña para "Mail"
5. Copiar la contraseña generada

### 2. Configurar Variables

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx  # App password
```

### 3. Límites

- **Gmail personal**: 500 emails/día
- **Google Workspace**: 2,000 emails/día

**Recomendación**: Para producción, usar SendGrid o AWS SES.

---

## SendGrid (Email Profesional)

### 1. Crear Cuenta

1. Ir a https://sendgrid.com
2. Crear cuenta gratuita (100 emails/día)
3. Verificar dominio

### 2. Crear API Key

1. Settings → API Keys
2. Create API Key
3. Seleccionar "Full Access"
4. Copiar API Key

### 3. Configurar Variables

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=SG.xxxxxxxxxxxxx  # API Key
```

### 4. Verificar Dominio

1. Settings → Sender Authentication
2. Domain Authentication
3. Agregar registros DNS

**Registros DNS requeridos:**

```
Type: TXT
Host: em1234.yourdomain.com
Value: v=spf1 include:sendgrid.net ~all

Type: CNAME
Host: s1._domainkey.yourdomain.com
Value: s1.domainkey.u1234567.wl123.sendgrid.net

Type: CNAME
Host: s2._domainkey.yourdomain.com
Value: s2.domainkey.u1234567.wl123.sendgrid.net
```

### 5. Configurar Email Templates

SendGrid también soporta templates dinámicos:

```typescript
await notificationsService.sendEmail({
  to: 'user@example.com',
  templateId: 'd-1234567890abcdef', // SendGrid template ID
  dynamicTemplateData: {
    name: 'Juan',
    total: '$100.00',
  },
});
```

---

## AWS SES (Email Empresarial)

### 1. Crear Cuenta AWS

1. Ir a https://aws.amazon.com/ses
2. Crear cuenta AWS
3. Activar SES en tu región

### 2. Verificar Email/Dominio

```bash
# Verificar email individual
aws ses verify-email-identity --email-address your-email@example.com

# Verificar dominio completo
aws ses verify-domain-identity --domain example.com
```

### 3. Salir de Sandbox Mode

Por defecto, SES está en sandbox (solo emails verificados). Para producción:

1. AWS Console → SES → Account Dashboard
2. "Request Production Access"
3. Completar formulario (explicar uso)
4. Esperar aprobación (~24 horas)

### 4. Crear SMTP Credentials

```bash
aws iam create-user --user-name ses-smtp-user
aws iam attach-user-policy --user-name ses-smtp-user \
  --policy-arn arn:aws:iam::aws:policy/AmazonSESFullAccess
aws iam create-access-key --user-name ses-smtp-user
```

### 5. Configurar Variables

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=AKIAIOSFODNN7EXAMPLE
SMTP_PASSWORD=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

### 6. Costos

- **Primeros 62,000 emails/mes**: GRATIS (si envías desde EC2)
- **Después**: $0.10 por cada 1,000 emails
- **Emails salientes**: $0.12 por GB

---

## Twilio (SMS)

### 1. Crear Cuenta

1. Ir a https://www.twilio.com
2. Crear cuenta (incluye crédito de prueba: $15)
3. Verificar número de teléfono

### 2. Obtener Credenciales

1. Console → Account Info
2. Copiar **Account SID**
3. Copiar **Auth Token**

### 3. Obtener Número

**Opción A: Número de Prueba (Trial)**

- Gratis
- Solo puede enviar a números verificados
- Mensajes incluyen "Sent from your Twilio trial account"

**Opción B: Comprar Número**

1. Phone Numbers → Buy a Number
2. Seleccionar país (Argentina: +54)
3. Buscar números disponibles
4. Comprar número (~$1-2/mes)

### 4. Configurar Variables

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+5491112345678
```

### 5. Verificar Números (Trial Mode)

Si estás en trial mode, necesitas verificar números:

1. Console → Phone Numbers → Verified Caller IDs
2. Add a new number
3. Ingresar número con código de país
4. Ingresar código de verificación recibido

### 6. Límites y Costos

**Trial Account:**

- $15 crédito gratis
- Solo a números verificados
- Incluye marca de agua en mensajes

**Paid Account:**

- Sin marca de agua
- Envío ilimitado
- Costos por país:
  - 🇦🇷 Argentina: $0.0185 / SMS
  - 🇺🇸 USA: $0.0079 / SMS
  - 🇲🇽 México: $0.0120 / SMS
  - 🇨🇱 Chile: $0.0185 / SMS
  - 🇨🇴 Colombia: $0.0055 / SMS

### 7. Configurar Webhooks (Opcional)

Para recibir confirmaciones de entrega:

```typescript
// Configurar webhook URL en Twilio Console
// URL: https://your-api.com/api/v1/webhooks/twilio/sms-status

// Handler en tu API
@Post('webhooks/twilio/sms-status')
async handleSmsStatus(@Body() body: any) {
  const { MessageSid, MessageStatus } = body;
  // MessageStatus: queued, sending, sent, delivered, undelivered, failed

  await this.emailLogService.update(MessageSid, {
    status: MessageStatus,
  });
}
```

---

## Firebase (Push Notifications)

### 1. Crear Proyecto

1. Ir a https://console.firebase.google.com
2. Click "Add project"
3. Nombre del proyecto: "retail-super-app"
4. Habilitar Google Analytics (opcional)
5. Click "Create project"

### 2. Agregar Apps

**Para Web:**

1. Project Overview → Add app → Web
2. Nombre: "Retail Web App"
3. Copiar Firebase Config

**Para Android:**

1. Project Overview → Add app → Android
2. Package name: `com.retailsuperapp.mobile`
3. Descargar `google-services.json`
4. Colocar en `android/app/`

**Para iOS:**

1. Project Overview → Add app → iOS
2. Bundle ID: `com.retailsuperapp.mobile`
3. Descargar `GoogleService-Info.plist`
4. Agregar a Xcode project

### 3. Generar Service Account

1. Project Settings (⚙️) → Service Accounts
2. Click "Generate New Private Key"
3. Confirmar y descargar JSON

### 4. Configurar Variables

**Opción A: Como JSON string**

```env
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"retail-super-app","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-...@retail-super-app.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'
```

**Opción B: Como archivo**

```typescript
// apps/api/src/notifications/services/push.service.ts
import * as admin from 'firebase-admin';
import serviceAccount from './firebase-admin-key.json';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});
```

### 5. Configurar en Apps

**React Native (Expo):**

```bash
npx expo install expo-notifications expo-device
```

```typescript
// app.json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff"
        }
      ]
    ],
    "android": {
      "googleServicesFile": "./google-services.json"
    },
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    }
  }
}
```

**Next.js (Web):**

```typescript
// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIza...',
  authDomain: 'retail-super-app.firebaseapp.com',
  projectId: 'retail-super-app',
  storageBucket: 'retail-super-app.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abcdef',
});

const messaging = firebase.messaging();
```

### 6. Límites

Firebase Cloud Messaging es **GRATIS** sin límites de mensajes.

---

## Redis (Queue System)

### Docker

```bash
docker run -d \
  --name redis \
  -p 6379:6379 \
  -v redis-data:/data \
  redis:7-alpine redis-server --appendonly yes
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: retail-redis
    ports:
      - '6379:6379'
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 3s
      retries: 3

volumes:
  redis-data:
```

### Producción

**Opciones recomendadas:**

**1. AWS ElastiCache**

```bash
# Crear cluster Redis
aws elasticache create-cache-cluster \
  --cache-cluster-id retail-redis \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1
```

Configurar variables:

```env
REDIS_HOST=retail-redis.abc123.cache.amazonaws.com
REDIS_PORT=6379
```

**2. Redis Cloud (Upstash)**

1. Ir a https://upstash.com
2. Crear database Redis
3. Copiar endpoint y password

```env
REDIS_HOST=us1-relieved-firefly-12345.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-upstash-password
REDIS_TLS=true
```

**3. Railway / Render**

Ambos ofrecen Redis managed con 1 click:

```env
REDIS_URL=redis://default:password@redis.railway.internal:6379
```

### Monitoreo Redis

```bash
# Conectar a Redis CLI
redis-cli

# Ver estadísticas
INFO stats

# Ver keys activas
KEYS *

# Monitor en tiempo real
MONITOR
```

---

## Testing de Proveedores

### Email

```bash
# Test SMTP connection
node -e "
const nodemailer = require('nodemailer');
const transport = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
});
transport.verify((error, success) => {
  if (error) console.error('Error:', error);
  else console.log('✓ SMTP connection OK');
});
"
```

### SMS

```bash
# Test Twilio
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" \
  -d "From=$TWILIO_PHONE_NUMBER" \
  -d "To=+5491112345678" \
  -d "Body=Test message from Retail Super App"
```

### Push

```bash
# Test FCM
curl -X POST https://fcm.googleapis.com/v1/projects/retail-super-app/messages:send \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "token": "YOUR_DEVICE_TOKEN",
      "notification": {
        "title": "Test",
        "body": "Test notification"
      }
    }
  }'
```

### Redis

```bash
# Test connection
redis-cli ping
# Expected: PONG

# Test set/get
redis-cli SET test "Hello Redis"
redis-cli GET test
# Expected: "Hello Redis"
```

---

## Troubleshooting Común

### Gmail bloquea conexiones

**Error**: "Invalid login: 535-5.7.8 Username and Password not accepted"

**Solución**:

1. Habilitar "Less secure app access" (no recomendado)
2. Usar App Password (recomendado)
3. Verificar que 2FA esté habilitado

### SendGrid emails en spam

**Problema**: Los emails llegan a spam.

**Solución**:

1. Verificar dominio completo (SPF, DKIM, DMARC)
2. Configurar sender authentication
3. Usar dominio propio (no @gmail.com)
4. Evitar palabras spam ("gratis", "urgente", etc.)
5. Incluir texto plano además de HTML

### Twilio SMS no llega

**Error**: "21211: Invalid 'To' Phone Number"

**Solución**:

```typescript
// Formato correcto: +[código país][número]
const validNumber = '+5491112345678'; // ✓ Argentina
const invalidNumber = '91112345678'; // ✗ Sin +54
```

### Firebase push no funciona en iOS

**Problema**: Push funciona en Android pero no en iOS.

**Solución**:

1. Verificar APNs certificate en Firebase Console
2. Agregar Push Notifications capability en Xcode
3. Verificar Bundle ID coincide
4. Probar con dispositivo real (no simulador)

---

## Costos Estimados

Para **10,000 usuarios activos** mensuales:

| Servicio        | Uso Estimado       | Costo Mensual |
| --------------- | ------------------ | ------------- |
| **SendGrid**    | 100,000 emails     | $14.95        |
| **Twilio SMS**  | 5,000 SMS (AR)     | $92.50        |
| **Firebase**    | Push ilimitado     | $0.00         |
| **AWS SES**     | 100,000 emails     | $10.00        |
| **Redis Cloud** | 30MB, 30 conn      | $0.00 (free)  |
| **ElastiCache** | cache.t3.micro     | $12.41        |
| **Total**       | -                  | **~$130/mes** |

**Recomendación**: Comenzar con planes gratuitos y escalar según necesidad.
