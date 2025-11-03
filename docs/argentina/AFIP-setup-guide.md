# Guía de Configuración AFIP para Facturación Electrónica

Esta guía detalla el proceso completo para configurar la integración con AFIP (Administración Federal de Ingresos Públicos) para facturación electrónica en Argentina.

## Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Generación de Certificados](#generación-de-certificados)
3. [Configuración en AFIP](#configuración-en-afip)
4. [Configuración de la Aplicación](#configuración-de-la-aplicación)
5. [Pruebas en Homologación](#pruebas-en-homologación)
6. [Paso a Producción](#paso-a-producción)
7. [Tipos de Comprobantes](#tipos-de-comprobantes)
8. [Resolución de Problemas](#resolución-de-problemas)

---

## Requisitos Previos

Antes de comenzar, asegúrate de tener:

- **CUIT del negocio**: 11 dígitos (ej: 20-12345678-9)
- **Clave Fiscal Nivel 3 o superior**: Obtener en https://www.afip.gob.ar/clavefiscal/
- **Condición fiscal definida**: Responsable Inscripto, Monotributista, etc.
- **Punto de venta habilitado**: Solicitar en AFIP

### Condiciones Fiscales y Tipos de Factura

| Condición Fiscal | Puede Emitir | Destinatario | Observaciones |
|-----------------|--------------|--------------|---------------|
| Responsable Inscripto (RI) | Factura A | RI con CUIT | Discrimina IVA |
| Responsable Inscripto (RI) | Factura B | Consumidor Final | IVA incluido (RG 5614/2024: discriminar) |
| Monotributista | Factura C | Cualquiera | Sin discriminación de IVA |
| Exento | Factura C | Cualquiera | Sin IVA |

---

## Generación de Certificados

Los certificados digitales son obligatorios para comunicarse con los servicios web de AFIP.

### 1. Generar Clave Privada

```bash
# Ubicarse en el directorio de certificados
cd apps/ar/certs

# Generar clave privada RSA de 2048 bits
openssl genrsa -out key.pem 2048
```

**⚠️ IMPORTANTE**: La clave privada (`key.pem`) debe mantenerse segura y NUNCA debe ser compartida o commiteada al repositorio.

### 2. Generar CSR (Certificate Signing Request)

```bash
# Reemplazar los datos con la información de tu empresa
openssl req -new -key key.pem -out csr.pem \
  -subj "/C=AR/O=TU_EMPRESA_SRL/CN=TU_NOMBRE/serialNumber=CUIT 20123456789"
```

Parámetros:
- **C**: Código de país (AR para Argentina)
- **O**: Nombre de la organización/empresa
- **CN**: Nombre común (tu nombre o razón social)
- **serialNumber**: CUIT en formato "CUIT XXXXXXXXXXX"

### 3. Ver el CSR generado

```bash
cat csr.pem
```

Copiar todo el contenido, incluyendo las líneas:
```
-----BEGIN CERTIFICATE REQUEST-----
...
-----END CERTIFICATE REQUEST-----
```

---

## Configuración en AFIP

### 1. Acceder al Portal AFIP

1. Ingresar a https://auth.afip.gob.ar
2. Usar Clave Fiscal (nivel 3 o superior)
3. Seleccionar el CUIT del contribuyente

### 2. Administrador de Relaciones de Clave Fiscal

1. Ir a **"Administrador de Relaciones de Clave Fiscal"**
2. Click en **"Nueva Relación"**

### 3. Agregar Servicio de Facturación Electrónica

1. Buscar servicio: **"Webservice Factura Electrónica (WSFEV1)"**
   - También conocido como "Factura Electrónica - Mercado Interno"
2. Click en **"Agregar"**

### 4. Generar Certificado Digital

1. En la relación recién creada, click en **"Generar Certificado"**
2. Seleccionar **"Generar nuevo certificado"**
3. Pegar el contenido del archivo `csr.pem` generado anteriormente
4. Click en **"Generar"**

### 5. Descargar Certificado

1. AFIP mostrará el certificado generado
2. Copiar todo el contenido (incluyendo BEGIN/END CERTIFICATE)
3. Guardar en `apps/ar/certs/cert.pem`

**Ejemplo de certificado:**
```
-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKZ...
...
-----END CERTIFICATE-----
```

### 6. Configurar Puntos de Venta

1. Ir a **"Administración de Puntos de Venta"** en el portal AFIP
2. Agregar un punto de venta electrónico
3. Asignar número (generalmente 1 para el primer punto)
4. Seleccionar tipo: **"Factura Electrónica"**

---

## Configuración de la Aplicación

### 1. Variables de Entorno

Editar el archivo `.env` (basarse en `.env.example`):

```bash
# AFIP Configuration
AFIP_CUIT=20123456789
AFIP_PRODUCTION=false  # false = homologación, true = producción
AFIP_PUNTO_VENTA=1

# Certificados de testing (homologación)
AFIP_CERT_PATH=./apps/ar/certs/cert-test.pem
AFIP_KEY_PATH=./apps/ar/certs/key-test.pem
```

### 2. Verificar Certificados

```bash
# Verificar que los archivos existan
ls -la apps/ar/certs/

# Deberías ver:
# - key.pem (o key-test.pem)
# - cert.pem (o cert-test.pem)
# - .gitignore
```

### 3. Verificar Conexión con AFIP

Puedes usar el endpoint de health check:

```typescript
// En el código
const status = await afipService.checkServerStatus();
console.log(status);
// { appserver: 'OK', dbserver: 'OK', authserver: 'OK' }
```

---

## Pruebas en Homologación

AFIP proporciona un ambiente de homologación (testing) para probar la integración sin afectar datos reales.

### 1. Obtener Certificados de Homologación

Los certificados de homologación se generan de la misma forma que los de producción, pero en el ambiente de testing de AFIP.

**URL de homologación**: https://wsaahomo.afip.gob.ar

### 2. CUIT de Prueba

Para testing, AFIP proporciona CUITs de prueba:
- **CUIT de prueba**: 20-40937847-2 (o similar según documentación AFIP)

### 3. Casos de Prueba

#### Factura A (Responsable Inscripto a Responsable Inscripto)

```typescript
const invoice = await afipService.generateInvoice({
  saleId: 'sale-123',
  tenantId: 'tenant-123',
  invoiceType: 'A',
  customerCuit: '20-12345678-9',
  customerName: 'Cliente SA',
  items: [
    {
      description: 'Producto Test',
      quantity: 1,
      unitPrice: 10000, // $100.00 en centavos
      taxRate: 0.21,
      total: 10000,
    },
  ],
  subtotal: 10000,
  tax: 2100,
  total: 12100,
});
```

#### Factura B (Responsable Inscripto a Consumidor Final)

```typescript
const invoice = await afipService.generateInvoice({
  saleId: 'sale-124',
  tenantId: 'tenant-123',
  invoiceType: 'B',
  // Sin CUIT para consumidor final
  items: [
    {
      description: 'Producto Test',
      quantity: 2,
      unitPrice: 5000,
      taxRate: 0.21,
      total: 10000,
    },
  ],
  subtotal: 10000,
  tax: 2100,
  total: 12100,
});
```

#### Factura C (Monotributista)

```typescript
const invoice = await afipService.generateInvoice({
  saleId: 'sale-125',
  tenantId: 'tenant-123',
  invoiceType: 'C',
  items: [
    {
      description: 'Servicio Test',
      quantity: 1,
      unitPrice: 15000,
      taxRate: 0, // Sin IVA para factura C
      total: 15000,
    },
  ],
  subtotal: 15000,
  tax: 0,
  total: 15000,
});
```

### 4. Validar Respuestas

Una respuesta exitosa debe incluir:

```typescript
{
  success: true,
  cae: '70417054367841',
  cae_vencimiento: '20241115',
  numero_comprobante: 1,
  fecha_proceso: '20241105',
  qr_code: 'https://www.afip.gob.ar/fe/qr/?p=eyJ...'
}
```

### 5. Verificar en Portal AFIP

1. Ingresar a https://www.afip.gob.ar
2. Ir a **"Facturación Electrónica"** → **"Comprobantes Autorizados"**
3. Verificar que el comprobante aparezca listado

---

## Paso a Producción

Una vez completadas las pruebas en homologación, seguir estos pasos para producción:

### 1. Checklist Pre-Producción

- [ ] Todas las pruebas en homologación exitosas
- [ ] Validado el flujo completo: Factura A, B y C
- [ ] Comprobado manejo de errores
- [ ] Configurado logging y monitoreo
- [ ] Backup de certificados en lugar seguro
- [ ] Alertas de vencimiento de certificados configuradas

### 2. Generar Certificados de Producción

Repetir el proceso de [Generación de Certificados](#generación-de-certificados) pero en el ambiente de producción:

```bash
# Generar clave privada de producción
openssl genrsa -out key-prod.pem 2048

# Generar CSR
openssl req -new -key key-prod.pem -out csr-prod.pem \
  -subj "/C=AR/O=TU_EMPRESA_SRL/CN=TU_NOMBRE/serialNumber=CUIT 20123456789"

# Subir CSR en AFIP (ambiente producción)
# Descargar y guardar certificado como cert-prod.pem
```

### 3. Actualizar Variables de Entorno

```bash
# Cambiar a producción
AFIP_PRODUCTION=true

# Usar certificados de producción
AFIP_CERT_PATH=./apps/ar/certs/cert-prod.pem
AFIP_KEY_PATH=./apps/ar/certs/key-prod.pem
```

### 4. Deploy y Validación

1. Hacer deploy a producción
2. Generar una factura de prueba interna
3. Verificar en portal AFIP que aparezca correctamente
4. Validar que el QR code funcione
5. Monitorear logs por errores

---

## Tipos de Comprobantes

### Códigos de Tipo de Comprobante AFIP

| Código | Tipo | Descripción |
|--------|------|-------------|
| 1 | Factura A | RI a RI, discrimina IVA |
| 2 | Nota de Débito A | Ajuste positivo a Factura A |
| 3 | Nota de Crédito A | Devolución o anulación de Factura A |
| 6 | Factura B | RI a Consumidor Final, IVA incluido |
| 7 | Nota de Débito B | Ajuste positivo a Factura B |
| 8 | Nota de Crédito B | Devolución o anulación de Factura B |
| 11 | Factura C | Monotributista o Exento, sin IVA |
| 12 | Nota de Débito C | Ajuste positivo a Factura C |
| 13 | Nota de Crédito C | Devolución o anulación de Factura C |
| 19 | Factura E | Exportación |

### Tipos de Documento del Cliente

| Código | Tipo |
|--------|------|
| 80 | CUIT |
| 86 | CUIL |
| 96 | DNI |
| 94 | Pasaporte |
| 99 | Consumidor Final |

### Códigos de IVA

| Código | Alícuota |
|--------|----------|
| 3 | 0% |
| 4 | 10.5% |
| 5 | 21% (general) |
| 6 | 27% |
| 8 | 5% |
| 9 | 2.5% |

---

## Resolución de Problemas

### Error: "Certificado vencido"

**Solución**: Renovar certificados siguiendo la guía de generación. Los certificados AFIP tienen validez de 2 años.

```bash
# Verificar fecha de vencimiento
openssl x509 -in cert.pem -noout -dates
```

### Error: "CUIT no autorizado para el servicio"

**Solución**: Verificar que la relación WSFEV1 esté activa en el Administrador de Relaciones AFIP.

### Error: "Punto de venta no autorizado"

**Solución**:
1. Verificar en AFIP que el punto de venta esté habilitado
2. Confirmar que `AFIP_PUNTO_VENTA` coincida con el número asignado

### Error: "Error de autenticación (WSAA)"

**Solución**:
1. Verificar que los certificados correspondan al CUIT configurado
2. Confirmar que no haya errores de reloj (diferencia horaria)
3. Verificar que el certificado esté en el formato correcto (PEM)

### Error: "Número de comprobante duplicado"

**Solución**: El sistema AFIP espera que los números sean consecutivos. Verificar el último número usado:

```typescript
const lastNumber = await afipService.getLastInvoiceNumber(
  AFIPInvoiceType.FACTURA_B,
  1 // punto de venta
);
console.log('Último número:', lastNumber);
```

### Error: "Validación de importes"

**Solución**: Verificar que:
- El total sea igual a subtotal + IVA
- Los montos estén en pesos con 2 decimales
- Los códigos de IVA sean correctos

### Logs de Debugging

Habilitar logs detallados:

```typescript
// En AFIPService, el logger muestra información útil
this.logger.debug('AFIP request:', invoiceData);
this.logger.debug('AFIP response:', response);
```

---

## Vencimiento de Certificados

**CRÍTICO**: Los certificados digitales de AFIP tienen vencimiento (generalmente 2 años).

### Configurar Alertas

Implementar un sistema de alertas 30 días antes del vencimiento:

```typescript
// Ejemplo de verificación
const cert = fs.readFileSync('apps/ar/certs/cert.pem', 'utf8');
const certInfo = x509.parseCert(cert);
const expirationDate = certInfo.notAfter;

if (daysBetween(new Date(), expirationDate) < 30) {
  sendAlert('Certificado AFIP próximo a vencer');
}
```

### Renovación

1. Generar nuevos certificados (key + CSR)
2. Subir nuevo CSR a AFIP
3. Descargar nuevo certificado
4. Actualizar archivos en el servidor
5. Reiniciar aplicación
6. Validar funcionamiento

---

## Recursos Adicionales

- **Portal AFIP**: https://www.afip.gob.ar
- **Clave Fiscal**: https://www.afip.gob.ar/clavefiscal/
- **Documentación WSFEV1**: https://www.afip.gob.ar/ws/documentacion/ws-factura-electronica.asp
- **Tablas de Códigos**: http://www.afip.gob.ar/fe/documentos/
- **Soporte AFIP**: 0800-999-2347

---

## Notas Finales

1. **Seguridad**: Mantener los certificados en ubicación segura, nunca en el repositorio
2. **Backup**: Realizar backups periódicos de los certificados
3. **Monitoreo**: Implementar alertas para detectar errores en tiempo real
4. **Auditoría**: Guardar logs de todas las transacciones AFIP
5. **Testing**: Siempre probar en homologación antes de producción

Para dudas o problemas, consultar la documentación oficial de AFIP o contactar soporte técnico.
