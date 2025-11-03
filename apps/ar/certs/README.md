# Certificados AFIP

Este directorio contiene los certificados necesarios para la integración con AFIP.

## ⚠️ IMPORTANTE

**NUNCA** commitear los archivos de certificados (.pem, .key, .crt) al repositorio.
Estos archivos contienen información sensible y son específicos de cada ambiente.

## Estructura de Archivos

- `cert.pem`: Certificado de producción (AFIP real)
- `key.pem`: Clave privada de producción
- `cert-test.pem`: Certificado de homologación (testing)
- `key-test.pem`: Clave privada de homologación

## Generación de Certificados

Ver la guía completa en: `docs/argentina/AFIP-setup-guide.md`

### Pasos Rápidos

1. Generar clave privada:
```bash
openssl genrsa -out key.pem 2048
```

2. Generar CSR (Certificate Signing Request):
```bash
openssl req -new -key key.pem -out csr.pem \
  -subj "/C=AR/O=TU_EMPRESA/CN=TU_NOMBRE/serialNumber=CUIT 20123456789"
```

3. Subir el CSR a AFIP:
   - Ingresar a https://auth.afip.gob.ar
   - Administrador de Relaciones → Nuevo Certificado
   - Seleccionar "Webservice Factura Electrónica"
   - Pegar contenido de `csr.pem`

4. Descargar certificado de AFIP y guardar como `cert.pem`

## Vencimiento

Los certificados AFIP tienen una validez limitada (generalmente 2 años).

**CRÍTICO**: Configurar alertas 30 días antes del vencimiento para renovar.

## Backup

Mantener backup seguro de los certificados en:
- Almacenamiento cifrado (1Password, Vault, etc)
- NO en el repositorio Git
- NO en carpetas compartidas sin cifrar
