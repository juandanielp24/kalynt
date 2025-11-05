# WhatsApp Business Integration Setup

## Instalación

### 1. Instalar dependencias

```bash
# Backend (API)
cd apps/api
pnpm install

# Frontend (Web)
cd apps/web
pnpm install
```

### 2. Ejecutar migraciones

```bash
cd packages/database
pnpm prisma migrate dev --name add_whatsapp_permissions
pnpm prisma generate
pnpm prisma db seed
```

### 3. Configurar variables de entorno

Agregar las siguientes variables en `apps/api/.env`:

```env
# WhatsApp Configuration
WHATSAPP_SESSION_SECRET=your_secret_here
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_token_here
```

## Conexión de WhatsApp

### Método 1: WhatsApp Web (whatsapp-web.js) - Recomendado para comenzar

1. Ir a la sección de WhatsApp en la aplicación web
2. Click en "Conectar WhatsApp"
3. Verificar la consola del servidor para ver el QR code
4. Escanear el QR con WhatsApp en tu teléfono:
   - Abrir WhatsApp en el teléfono
   - Ir a **Menú → Dispositivos vinculados**
   - Tocar "Vincular un dispositivo"
   - Escanear el código QR mostrado en la pantalla

**Notas importantes:**
- La sesión se guarda automáticamente en `.wwebjs_auth/`
- La conexión persiste entre reinicios del servidor
- No cerrar la sesión de WhatsApp Web manualmente o se desconectará

### Método 2: WhatsApp Business API (Oficial) - Para producción

Para usar la API oficial de WhatsApp Business:

1. Crear cuenta en [Meta Business](https://business.facebook.com/)
2. Configurar WhatsApp Business API
3. Obtener credenciales:
   - Phone Number ID
   - Business Account ID
   - Access Token
4. Actualizar variables de entorno:

```env
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_BUSINESS_ACCOUNT_ID=your_account_id
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
```

## Uso

### Notificaciones Automáticas

Las notificaciones se envían automáticamente cuando ocurren ciertos eventos:

| Evento | Notificación | Activado por |
|--------|--------------|--------------|
| Venta creada | Confirmación de pedido | `sale.created` event |
| Pago recibido | Confirmación de pago | `payment.received` event |
| Stock disponible | Alerta a clientes interesados | `stock.updated` event |
| Stock bajo | Alerta a administradores | `stock.updated` event |
| Cliente nuevo | Mensaje de bienvenida | `customer.created` event |

**Configurar notificaciones:**
1. Ir a **WhatsApp → Configuración**
2. Conectar WhatsApp
3. Activar las notificaciones deseadas:
   - ✅ Notificaciones Habilitadas
   - ✅ Confirmaciones de Pedidos
   - ✅ Alertas de Stock
   - ✅ Recordatorios de Pago

### Plantillas

Crea plantillas personalizadas con variables dinámicas:

**Variables disponibles:**
- `{customerName}` - Nombre del cliente
- `{orderNumber}` - Número de pedido
- `{totalAmount}` - Monto total
- `{orderDate}` - Fecha del pedido
- `{businessName}` - Nombre del negocio
- `{productName}` - Nombre del producto
- `{price}` - Precio
- `{quantity}` - Cantidad
- `{locationAddress}` - Dirección de ubicación
- `{businessHours}` - Horario de atención
- `{amount}` - Monto
- `{dueDate}` - Fecha de vencimiento
- `{deliveryMethod}` - Método de entrega

**Ejemplo de plantilla:**

```
Hola {customerName}! 👋

Tu pedido #{orderNumber} ha sido confirmado por {totalAmount}.

Fecha: {orderDate}

Muchas gracias por tu compra!
{businessName}
```

**Gestión de plantillas:**
1. Ir a **WhatsApp → Plantillas**
2. Click en "Nueva Plantilla" o "Crear Plantillas Predeterminadas"
3. Completar:
   - Nombre de la plantilla
   - Tipo (Confirmación de pedido, Recordatorio de pago, etc.)
   - Contenido con variables
4. Activar la plantilla
5. Las plantillas activas se usan automáticamente

### Envío Manual

**Mensaje Individual:**
1. Ir a **WhatsApp → Enviar**
2. Tab "Mensaje Individual"
3. Ingresar número de teléfono (con código de país)
4. Escribir mensaje
5. Opcionalmente agregar URL de imagen/video
6. Click en "Enviar Mensaje"

**Mensaje Masivo:**
1. Ir a **WhatsApp → Enviar**
2. Tab "Mensaje Masivo"
3. Ingresar números (uno por línea o separados por coma)
4. Escribir mensaje
5. Click en "Enviar a X números"

**Nota:** Los mensajes masivos se envían con un intervalo de 2-3 segundos entre cada uno para evitar límites de tasa.

### Analytics

Ver estadísticas de mensajes en **WhatsApp → Analytics**:

- **Total Mensajes**: Cantidad total enviada
- **Tasa de Entrega**: Porcentaje de mensajes entregados
- **Tasa de Lectura**: Porcentaje de mensajes leídos
- **Tasa de Fallo**: Porcentaje de mensajes fallidos

**Gráficos disponibles:**
- Distribución por estado (pie chart)
- Tasas de rendimiento (bar chart)
- Insights de performance

**Períodos disponibles:**
- Últimos 7 días
- Últimos 30 días
- Últimos 60 días
- Últimos 90 días

### Recordatorios Automáticos de Pago

Los recordatorios de pago se envían automáticamente todos los días a las 9:00 AM para ventas con pagos pendientes que vencen en los próximos 3 días.

**Configuración del cron:**
- Archivo: `apps/api/src/whatsapp/whatsapp.cron.ts`
- Horario: 9:00 AM diario
- Expresión: `@Cron(CronExpression.EVERY_DAY_AT_9AM)`

**Para cambiar el horario:**
```typescript
// Opciones disponibles:
@Cron(CronExpression.EVERY_DAY_AT_10AM)
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
@Cron('0 9 * * *') // Formato cron personalizado
```

## Permisos RBAC

Los permisos de WhatsApp están integrados con el sistema RBAC:

| Rol | Permisos |
|-----|----------|
| **Owner** | `WHATSAPP:MANAGE` - Control total |
| **Admin** | `WHATSAPP:MANAGE` - Control total |
| **Manager** | `WHATSAPP:READ`, `WHATSAPP:CREATE` - Ver y enviar mensajes |
| **Cashier** | Sin acceso |

## Troubleshooting

### QR Code no aparece

**Problema:** El código QR no se muestra en la interfaz o en la consola.

**Soluciones:**
1. Verificar que `puppeteer` esté instalado correctamente:
   ```bash
   cd apps/api
   pnpm install puppeteer
   ```
2. Revisar logs del servidor:
   ```bash
   pnpm dev
   ```
3. Verificar permisos de escritura en `.wwebjs_auth`:
   ```bash
   chmod 755 .wwebjs_auth
   ```
4. Limpiar sesión anterior y reconectar:
   ```bash
   rm -rf .wwebjs_auth
   ```

### Mensajes no se envían

**Problema:** Los mensajes aparecen como pendientes o fallidos.

**Soluciones:**
1. Verificar que WhatsApp esté conectado en **Configuración**
2. Verificar formato de número de teléfono:
   - ✅ Correcto: `+54 9 11 1234-5678`
   - ❌ Incorrecto: `11 1234-5678`
3. Verificar que las notificaciones estén habilitadas en configuración
4. Revisar logs del servidor para errores específicos
5. Verificar que la plantilla esté activa (si aplica)

### Desconexión frecuente

**Problema:** WhatsApp se desconecta constantemente.

**Soluciones:**
1. Mantener el servidor corriendo 24/7 (usar PM2 o Docker)
2. No usar el mismo número en múltiples dispositivos simultáneamente
3. Verificar conexión a internet del servidor
4. No cerrar sesión de WhatsApp Web manualmente
5. Considerar usar WhatsApp Business API oficial para producción

### Error "Número no registrado en WhatsApp"

**Problema:** El mensaje falla con error de número no válido.

**Soluciones:**
1. Verificar que el número esté registrado en WhatsApp
2. Verificar formato: debe incluir código de país con `+`
3. Remover espacios y guiones antes de enviar (el sistema lo hace automáticamente)
4. Verificar que el número no esté bloqueado

### Tasa de entrega baja (< 85%)

**Causas posibles:**
- Números de teléfono incorrectos o no registrados
- WhatsApp desconectado
- Límites de tasa excedidos
- Números bloqueados o reportados

**Soluciones:**
1. Validar números antes de enviar
2. Mantener WhatsApp conectado
3. Respetar delays entre mensajes masivos (2-3 segundos)
4. Limpiar base de datos de números inválidos

## Arquitectura

### Backend (NestJS)

```
apps/api/src/whatsapp/
├── whatsapp.service.ts              # Cliente de WhatsApp (whatsapp-web.js)
├── whatsapp-config.service.ts       # Gestión de configuración
├── whatsapp-notifications.service.ts # Envío de notificaciones
├── whatsapp-events.listener.ts      # Event listeners
├── whatsapp.controller.ts           # REST API endpoints
├── whatsapp.module.ts               # NestJS module
└── whatsapp.cron.ts                 # Cron jobs
```

**Servicios:**
- `WhatsAppService`: Cliente principal de WhatsApp
- `WhatsAppConfigService`: CRUD de configuración
- `WhatsAppNotificationsService`: Lógica de notificaciones
- `WhatsAppEventsListener`: Escucha eventos del sistema
- `WhatsAppCronService`: Tareas programadas

**Endpoints:**
- `GET /whatsapp/config` - Obtener configuración
- `PUT /whatsapp/config` - Actualizar configuración
- `POST /whatsapp/connect` - Conectar WhatsApp
- `POST /whatsapp/disconnect` - Desconectar WhatsApp
- `GET /whatsapp/status` - Estado de conexión
- `GET /whatsapp/templates` - Listar plantillas
- `POST /whatsapp/templates` - Crear plantilla
- `PUT /whatsapp/templates/:id` - Actualizar plantilla
- `DELETE /whatsapp/templates/:id` - Eliminar plantilla
- `GET /whatsapp/messages` - Listar mensajes
- `POST /whatsapp/messages/send` - Enviar mensaje
- `POST /whatsapp/messages/bulk` - Envío masivo
- `GET /whatsapp/messages/stats` - Estadísticas

### Frontend (Next.js)

```
apps/web/src/
├── lib/api/whatsapp.ts                      # API client
├── app/(dashboard)/whatsapp/page.tsx        # Página principal
└── components/whatsapp/
    ├── WhatsAppConfiguration.tsx            # Configuración y conexión
    ├── WhatsAppMessages.tsx                 # Historial de mensajes
    ├── WhatsAppSendMessage.tsx              # Envío de mensajes
    ├── WhatsAppTemplates.tsx                # Gestión de plantillas
    └── WhatsAppAnalytics.tsx                # Dashboard de analytics
```

**Componentes:**
- `WhatsAppConfiguration`: Estado de conexión, QR code, settings
- `WhatsAppMessages`: Tabla de mensajes con filtros
- `WhatsAppSendMessage`: Formularios de envío individual y masivo
- `WhatsAppTemplates`: CRUD de plantillas con vista previa
- `WhatsAppAnalytics`: Gráficos y estadísticas

### Base de Datos (Prisma)

```
packages/database/prisma/
├── schema.prisma                    # Schema con modelos y enums
└── seeds/
    └── rbac.seed.ts                 # Permisos de WhatsApp
```

**Modelos:**
- `WhatsAppConfig`: Configuración por tenant
- `WhatsAppTemplate`: Plantillas de mensajes
- `WhatsAppMessage`: Mensajes enviados/recibidos

## Desarrollo

### Ejecutar en modo desarrollo

```bash
# Terminal 1 - API
cd apps/api
pnpm dev

# Terminal 2 - Web
cd apps/web
pnpm dev
```

### Logs

Los logs de WhatsApp se pueden ver en la consola del servidor:

```bash
[WhatsAppService] Client initialized
[WhatsAppService] QR code received
[WhatsAppService] WhatsApp client ready!
[WhatsAppNotificationsService] Sending order confirmation for sale xxx
[WhatsAppEventsListener] Handling sale.created event for sale xxx
```

### Testing

```bash
# Unit tests
cd apps/api
pnpm test

# E2E tests
cd apps/api
pnpm test:e2e
```

## Producción

### Configuración de producción

1. **Usar WhatsApp Business API oficial** en lugar de whatsapp-web.js
2. **Configurar PM2** para mantener el servidor corriendo:
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```
3. **Configurar logs**: Usar Winston o similar para logs estructurados
4. **Monitoreo**: Configurar alertas para desconexiones
5. **Backups**: Hacer backup de `.wwebjs_auth/` periódicamente

### Rate Limits

- **Mensajes individuales**: Sin límite específico
- **Mensajes masivos**: 2-3 segundos entre mensajes (configurable)
- **WhatsApp Business API**: Ver documentación oficial de Meta

### Seguridad

- ✅ Permisos RBAC implementados
- ✅ Validación de números de teléfono
- ✅ Rate limiting en API
- ✅ Audit logs de configuración
- ✅ Variables de entorno para credenciales
- ⚠️ Implementar HTTPS en producción
- ⚠️ Validar webhook tokens

## Recursos

- [WhatsApp Web.js Documentation](https://wwebjs.dev/)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Meta Business Suite](https://business.facebook.com/)
- [NestJS Schedule](https://docs.nestjs.com/techniques/task-scheduling)
- [Prisma Documentation](https://www.prisma.io/docs/)

## Soporte

Para problemas o preguntas:
1. Revisar esta documentación
2. Verificar logs del servidor
3. Consultar documentación de whatsapp-web.js
4. Abrir issue en el repositorio

---

**Última actualización:** Noviembre 2024
**Versión:** 1.0.0
