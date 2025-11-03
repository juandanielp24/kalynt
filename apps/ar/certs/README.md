# Certificados AFIP/ARCA

## ⚠️ IMPORTANTE
Los certificados NUNCA deben commitearse al repositorio.

## Configuración para Desarrollo (Testing)

1. **Obtener certificado de homologación**:
   - Ir a: https://www.afip.gob.ar/ws/WSAA/
   - Descargar certificado de prueba
   - CUIT de testing: 20409378472

2. **Ubicación de archivos**:
```
apps/ar/certs/
├── cert-test.pem      # Certificado de testing
├── key-test.pem       # Clave privada de testing
├── cert-prod.pem      # Certificado de producción
└── key-prod.pem       # Clave privada de producción
```

3. **Generar certificado de prueba** (si no lo tienes):
```bash
# Generar clave privada
openssl genrsa -out key-test.pem 2048

# Generar CSR (Certificate Signing Request)
openssl req -new -key key-test.pem -out cert-test.csr \
  -subj "/C=AR/O=Test/CN=testing/serialNumber=CUIT 20409378472"

# Subir el CSR a AFIP para obtener el certificado firmado
```

## Configuración para Producción

1. **Generar certificado real**:
   - Acceder con Clave Fiscal nivel 3 o superior
   - Ir a: AFIP > Administrador de Relaciones de Clave Fiscal
   - Agregar relación "Webservice de Factura Electrónica"
   - Generar certificado (válido por 3 años)

2. **Variables de entorno**:
```env
# Development
AFIP_ENVIRONMENT=testing
AFIP_CERT_PATH=./apps/ar/certs/cert-test.pem
AFIP_KEY_PATH=./apps/ar/certs/key-test.pem

# Production
AFIP_ENVIRONMENT=production
AFIP_CERT_PATH=./apps/ar/certs/cert-prod.pem
AFIP_KEY_PATH=./apps/ar/certs/key-prod.pem
```

## Renovación de Certificados

Los certificados de AFIP vencen cada 3 años. Configurar alerta 30 días antes.

## Seguridad

- Certificados deben estar en .gitignore
- En producción, usar secrets manager (AWS Secrets Manager, etc.)
- Nunca compartir certificados por email o chat
- Backup encriptado de certificados
