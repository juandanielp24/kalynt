# @retail/ar - Argentina Localization Package

Complete AFIP integration for electronic invoicing in Argentina.

## Features

- ✅ **WSAA Authentication** - Automatic authentication with AFIP servers
- ✅ **WSFEv1 Electronic Invoicing** - Generate and query electronic invoices
- ✅ **QR Code Generation** - Generate AFIP-compliant QR codes for invoices
- ✅ **Invoice Mapper** - Simplified sale data to AFIP format conversion
- ✅ **CUIT Validation** - Complete CUIT/CUIL validation with check digit
- ✅ **Date Formatting** - Argentina timezone handling
- ✅ **Invoice Formatting** - Invoice number formatting and validation
- ✅ **Amount Validation** - Comprehensive invoice amount validation
- ✅ **Comprehensive DTOs** - Full validation with class-validator
- ✅ **Error Handling** - Detailed error messages and retry logic
- ✅ **Credential Caching** - Automatic token renewal
- ✅ **Unit Tests** - >80% test coverage

## Installation

This package is part of the monorepo. Install dependencies:

```bash
pnpm install
```

## Configuration

### Environment Variables

Create a `.env` file in your application:

```bash
# AFIP Configuration
AFIP_CUIT=20409378472
AFIP_ENVIRONMENT=testing  # or 'production'
AFIP_CERT_PATH=./apps/ar/certs/cert.pem
AFIP_KEY_PATH=./apps/ar/certs/key.key
```

### Certificate Setup

1. Generate a certificate request:
```bash
cd apps/ar/certs
openssl req -new -newkey rsa:2048 -nodes -keyout key.key -out request.csr
```

2. Go to AFIP website and upload the CSR
3. Download the certificate and save as `cert.pem`

See `apps/ar/certs/README.md` for detailed instructions.

## Usage

### Module Registration

```typescript
import { AFIPModule } from '@retail/ar';

@Module({
  imports: [
    AFIPModule,
    // ... other modules
  ],
})
export class AppModule {}
```

### Generate Invoice

```typescript
import { AFIPService, GenerateInvoiceDto } from '@retail/ar';

@Injectable()
export class InvoiceService {
  constructor(private afipService: AFIPService) {}

  async createInvoice() {
    const invoice: GenerateInvoiceDto = {
      concept: 1, // Productos
      invoiceType: 6, // Factura B
      salePoint: 1,
      invoiceNumber: 123,
      invoiceDate: '20250115',
      docType: 99, // Consumidor final
      docNum: 0,
      totalAmount: 1210,
      netAmount: 1000,
      exemptAmount: 0,
      taxAmount: 210,
      untaxedAmount: 0,
      currency: 'PES',
      exchangeRate: 1,
      iva: [
        {
          id: 5, // 21%
          baseAmount: 1000,
          taxAmount: 210,
        },
      ],
    };

    const response = await this.afipService.generateInvoice(invoice);

    if (response.result === 'A') {
      console.log('Invoice approved!');
      console.log('CAE:', response.cae);
      console.log('Expiration:', response.caeExpirationDate);
    }
  }
}
```

### Get Last Invoice Number

```typescript
const lastNumber = await afipService.getLastInvoiceNumber({
  invoiceType: 6,
  salePoint: 1,
});

const nextNumber = lastNumber + 1;
```

### Query Invoice

```typescript
const invoice = await afipService.queryInvoice({
  invoiceType: 6,
  salePoint: 1,
  invoiceNumber: 123,
});

if (invoice) {
  console.log('CAE:', invoice.cae);
  console.log('Total:', invoice.totalAmount);
}
```

### Check Server Status

```typescript
const status = await afipService.checkServerStatus();

console.log('App Server:', status.appServer);
console.log('DB Server:', status.dbServer);
console.log('Auth Server:', status.authServer);
```

## Advanced Usage

### WSAA Service Methods

```typescript
import { WSAAService } from '@retail/ar';

@Injectable()
export class MyService {
  constructor(private wsaaService: WSAAService) {}

  async advancedWSAA() {
    // Check if credentials are cached and valid
    const hasValid = this.wsaaService.hasValidCredentials();
    console.log('Has valid credentials:', hasValid);

    // Get time to live in seconds
    const ttl = this.wsaaService.getCredentialsTimeToLive();
    console.log('Credentials expire in:', ttl, 'seconds');

    // Generate TRA for testing/debugging
    const tra = this.wsaaService.createTRA('wsfe');
    console.log('Generated TRA:', tra);

    // Sign TRA for testing/debugging
    const cms = this.wsaaService.signTRA(tra);
    console.log('Signed CMS:', cms);

    // Clear credentials cache (useful for testing)
    this.wsaaService.clearCredentials();
  }
}
```

### WSFEV1 Service Methods

```typescript
import { WSFEv1Service } from '@retail/ar';

@Injectable()
export class MyService {
  constructor(private wsfev1Service: WSFEv1Service) {}

  async advancedWSFEv1() {
    // Get last CAE for verification
    const lastCAE = await this.wsfev1Service.getLastCAE(6, 1);
    if (lastCAE) {
      console.log('Last CAE:', lastCAE.cae);
      console.log('Invoice number:', lastCAE.invoiceNumber);
      console.log('Expires:', lastCAE.expirationDate);
    }

    // Validate a CAE
    const isValid = await this.wsfev1Service.validateCAE(
      6, // invoice type
      1, // point of sale
      123, // invoice number
      '75123456789012' // CAE to validate
    );
    console.log('CAE is valid:', isValid);

    // Build SOAP envelope for debugging
    const envelope = this.wsfev1Service.buildSOAPEnvelope('FECompConsultar', {
      PtoVta: 1,
      CbteTipo: 6,
      CbteNro: 123,
    });
    console.log('SOAP envelope:', envelope);

    // Parse errors for debugging
    const errors = this.wsfev1Service.parseErrors({
      Err: [
        { Code: '10048', Msg: 'CUIT invalido' },
        { Code: '10049', Msg: 'Punto de venta invalido' },
      ],
    });
    console.log('Parsed errors:', errors);
  }
}
```

## REST API Endpoints

The package includes a controller with REST endpoints:

### GET /afip/status
Check AFIP server status

### GET /afip/last-invoice-number
Get last authorized invoice number
- Query: `invoiceType`, `salePoint`

### POST /afip/generate-invoice
Generate electronic invoice
- Body: `GenerateInvoiceDto`

### GET /afip/query-invoice
Query invoice information
- Query: `invoiceType`, `salePoint`, `invoiceNumber`

### POST /afip/clear-cache
Clear credentials cache (testing)

### GET /afip/current-date
Get current date in AFIP format

## Utilities

### CUIT Validation

```typescript
import { CuitValidator } from '@retail/ar';

const isValid = CuitValidator.validate('20-40937847-2');
const digit = CuitValidator.calculateVerificationDigit('2040937847');
const formatted = CuitValidator.format('20409378472'); // '20-40937847-2'
```

### Date Formatting

```typescript
import { DateFormatter } from '@retail/ar';

const afipDate = DateFormatter.toAFIPFormat(); // '20250115'
const wsaaDate = DateFormatter.toWSAAFormat(); // '2025-01-15T10:30:00'
const parsed = DateFormatter.fromAFIPFormat('20250115');
const caeExpiration = DateFormatter.getCAEExpirationDate(); // +10 days
```

### Invoice Formatting

```typescript
import { InvoiceFormatter } from '@retail/ar';

const formatted = InvoiceFormatter.formatInvoiceNumber(1, 123);
// '00001-00000123'

const parsed = InvoiceFormatter.parseInvoiceNumber('00001-00000123');
// { salePoint: 1, invoiceNumber: 123 }

const nextInvoice = InvoiceFormatter.incrementInvoiceNumber('00001-00000123');
// '00001-00000124'

const iva = InvoiceFormatter.calculateIVA(1000, 21);
// { baseAmount: 1000, taxAmount: 210, ivaId: 5 }

const isValid = InvoiceFormatter.validateAmounts({
  netAmount: 1000,
  taxAmount: 210,
  exemptAmount: 0,
  untaxedAmount: 0,
  totalAmount: 1210,
});
```

### QR Code Generation

```typescript
import { QRGenerator } from '@retail/ar';

// Generate QR code URL for an invoice
const qrUrl = QRGenerator.generateInvoiceQRData({
  cuit: '20409378472',
  pointOfSale: 1,
  invoiceType: 6, // Factura B
  invoiceNumber: 123,
  invoiceDate: '20250115',
  total: 1210.00,
  currency: 'PES',
  exchangeRate: 1,
  documentType: 99, // Consumidor final
  documentNumber: '0',
  cae: '75123456789012',
});

// URL: https://www.afip.gob.ar/fe/qr/?ver=1&fecha=2025-01-15&cuit=...

// Validate QR URL format
const isValid = QRGenerator.validateQRURL(qrUrl);

// Parse QR URL to extract parameters
const params = QRGenerator.parseQRURL(qrUrl);
console.log(params.cae); // '75123456789012'
```

### Invoice Mapper (Simplified Integration)

```typescript
import { InvoiceMapper, SaleData } from '@retail/ar';

// Your sale data (in your app's format)
const saleData: SaleData = {
  saleId: 'sale-123',
  tenantId: 'tenant-456',
  invoiceType: 'B', // Simplified: 'A', 'B', 'C', or 'E'
  concept: 1, // 1: products, 2: services, 3: mixed
  customerCuit: '20409378472',
  customerName: 'Juan Pérez',
  items: [
    {
      description: 'Product 1',
      quantity: 2,
      unitPrice: 50000, // In centavos (500 pesos)
      taxRate: 21, // 21% IVA
      total: 121000, // In centavos (1210 pesos)
    },
  ],
  subtotal: 100000, // In centavos
  tax: 21000, // In centavos
  total: 121000, // In centavos
};

// Convert to AFIP format automatically
const afipRequest = InvoiceMapper.mapSaleToInvoiceRequest(
  saleData,
  1, // point of sale
  123 // invoice number
);

// afipRequest is ready to send to AFIP
const response = await afipService.generateInvoice(afipRequest);

// Amount validation
const validation = InvoiceMapper.validateAmounts({
  subtotal: 1000,
  tax: 210,
  total: 1210,
});

if (!validation.valid) {
  console.error(validation.error);
}

// Calculate IVA
const taxAmount = InvoiceMapper.calculateIVA(1000, 21); // 210

// Calculate net from gross
const netAmount = InvoiceMapper.calculateNetFromGross(1210, 21); // 1000

// Format/parse amounts (centavos <-> pesos)
const formatted = InvoiceMapper.formatAmount(121000); // '1210.00'
const cents = InvoiceMapper.parseAmount('1210.00'); // 121000
```

## Constants

```typescript
import {
  INVOICE_TYPES,
  DOCUMENT_TYPES,
  CONCEPT_TYPES,
  IVA_RATES,
  CURRENCY_CODES,
  AFIP_URLS,
  // AFIP-prefixed aliases (alternative naming)
  AFIP_INVOICE_TYPES,
  AFIP_DOCUMENT_TYPES,
  AFIP_CONCEPT_TYPES,
  AFIP_IVA_CODES,
} from '@retail/ar';

// Invoice types
INVOICE_TYPES.FACTURA_A // 1
INVOICE_TYPES.FACTURA_B // 6
INVOICE_TYPES.FACTURA_C // 11
INVOICE_TYPES.FACTURA_E // 19 (export)
INVOICE_TYPES.NOTA_CREDITO_A // 3

// Document types
DOCUMENT_TYPES.CUIT // 80
DOCUMENT_TYPES.CUIL // 86
DOCUMENT_TYPES.DNI // 96
DOCUMENT_TYPES.CONSUMIDOR_FINAL // 99

// Concept types
CONCEPT_TYPES.PRODUCTOS // 1
CONCEPT_TYPES.SERVICIOS // 2
CONCEPT_TYPES.PRODUCTOS_Y_SERVICIOS // 3

// IVA rates (lookup table)
IVA_RATES[21] // 5
IVA_RATES[10.5] // 4
IVA_RATES[27] // 6
IVA_RATES[5] // 8
IVA_RATES[2.5] // 9

// IVA codes (direct codes)
AFIP_IVA_CODES.IVA_21 // 5
AFIP_IVA_CODES.IVA_10_5 // 4
AFIP_IVA_CODES.IVA_27 // 6
AFIP_IVA_CODES.IVA_5 // 8
AFIP_IVA_CODES.IVA_2_5 // 9
AFIP_IVA_CODES.IVA_0 // 3
AFIP_IVA_CODES.EXENTO // 2
```

## Testing

Run unit tests:

```bash
pnpm --filter @retail/ar test
```

Run with coverage:

```bash
pnpm --filter @retail/ar test:cov
```

## Architecture

```
apps/ar/
├── src/
│   ├── afip/
│   │   ├── wsaa/                    # WSAA authentication
│   │   │   ├── wsaa.service.ts
│   │   │   └── wsaa.types.ts
│   │   ├── wsfev1/                  # WSFEv1 invoicing
│   │   │   ├── wsfev1.service.ts
│   │   │   └── wsfev1.types.ts
│   │   ├── types/                   # Type definitions
│   │   │   ├── afip.types.ts
│   │   │   └── index.ts
│   │   ├── dto/                     # DTOs with validation
│   │   ├── utils/                   # Utilities
│   │   │   ├── cuit-validator.ts
│   │   │   ├── date-formatter.ts
│   │   │   ├── invoice-formatter.ts
│   │   │   ├── qr-generator.ts      # QR code generation
│   │   │   ├── invoice-mapper.ts    # Sale data mapper
│   │   │   └── index.ts
│   │   ├── afip.service.ts          # Facade
│   │   ├── afip.controller.ts       # REST endpoints
│   │   ├── afip.module.ts           # NestJS module
│   │   └── index.ts
│   ├── constants/
│   │   └── argentina.constants.ts
│   └── index.ts
├── certs/                           # Certificates (gitignored)
└── package.json
```

## Invoice Types

| Type | Code | Description |
|------|------|-------------|
| Factura A | 1 | Registered taxpayer |
| Nota de Débito A | 2 | Debit note A |
| Nota de Crédito A | 3 | Credit note A |
| Factura B | 6 | General public |
| Nota de Débito B | 7 | Debit note B |
| Nota de Crédito B | 8 | Credit note B |
| Factura C | 11 | Exempt |
| Nota de Débito C | 12 | Debit note C |
| Nota de Crédito C | 13 | Credit note C |
| Factura E | 19 | Export invoice |
| Factura M | 51 | Service voucher |

## Document Types

| Type | Code | Description |
|------|------|-------------|
| CUIT | 80 | Tax ID |
| CUIL | 86 | Labor ID |
| CDI | 87 | Foreign ID |
| LE | 89 | ID card (old) |
| LC | 90 | Civic card (old) |
| Pasaporte | 94 | Passport |
| DNI | 96 | National ID |
| Consumidor Final | 99 | End consumer |

## IVA Rates

| Rate | Code | Description |
|------|------|-------------|
| 0% | 3 | Not taxed |
| 2.5% | 9 | Super reduced |
| 5% | 8 | Very reduced |
| 10.5% | 4 | Reduced |
| 21% | 5 | Standard |
| 27% | 6 | Increased |
| Exento | 2 | Exempt |
| No Gravado | 1 | Not subject to tax |

## Error Handling

The service throws `BadRequestException` with detailed error messages:

```typescript
try {
  await afipService.generateInvoice(invoice);
} catch (error) {
  if (error instanceof BadRequestException) {
    console.error('AFIP Error:', error.message);
    // Example: "Invoice rejected by AFIP: [10048] CUIT invalido"
  }
}
```

## Testing Scripts

### Test AFIP Connection

```bash
# Run integration test script
TOKEN=your-jwt-token ./apps/ar/scripts/test-afip.sh

# Or with custom API URL
API_URL=http://localhost:4000 TOKEN=your-jwt \
  ./apps/ar/scripts/test-afip.sh
```

This script tests:
- AFIP server connection
- Getting next invoice number
- Current date formatting
- Basic endpoint functionality

### Verify Certificates

```bash
# Verify certificate and key match
./apps/ar/scripts/verify-certificates.sh
```

This checks:
- Certificate files exist
- Certificate is valid
- Private key matches certificate

### Run Unit Tests

```bash
# All tests
pnpm --filter @retail/ar test

# With coverage
pnpm --filter @retail/ar test:cov

# Watch mode
pnpm --filter @retail/ar test:watch
```

## Integration with Sales Module

The AFIP service is designed to integrate seamlessly with your sales module:

```typescript
// apps/api/src/modules/sales/sales.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient } from '@retail/database';
import { AFIPService } from '@retail/ar';

@Injectable()
export class SalesService {
  constructor(
    @Inject('PRISMA') private prisma: PrismaClient,
    private afipService: AFIPService,
  ) {}

  async processSale(tenantId: string, userId: string, dto: CreateSaleDto) {
    // 1. Create sale in DB
    const sale = await this.createSale(tenantId, userId, dto);

    // 2. Decrement stock
    await this.decrementStock(sale.id, sale.items);

    // 3. Generate invoice if requested
    if (dto.generateInvoice && dto.invoiceType) {
      try {
        const invoiceResult = await this.afipService.generateInvoiceForSale({
          saleId: sale.id,
          tenantId,
          invoiceType: dto.invoiceType,
          customerCuit: dto.customerCuit,
          customerName: dto.customerName,
          items: sale.items.map(item => ({
            description: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPriceCents / 100,
            taxRate: 21,
            total: item.totalCents / 100,
          })),
          subtotal: sale.subtotalCents / 100,
          tax: sale.taxCents / 100,
          total: sale.totalCents / 100,
        });

        if (!invoiceResult.success) {
          // Log error but don't fail the sale
          await this.prisma.sale.update({
            where: { id: sale.id },
            data: { invoiceError: JSON.stringify(invoiceResult.afipResponse?.errors) },
          });
        }
      } catch (error) {
        console.error('AFIP error:', error);
        await this.prisma.sale.update({
          where: { id: sale.id },
          data: { invoiceError: error.message },
        });
      }
    }

    return sale;
  }
}
```

## Troubleshooting

### Certificate errors

- Ensure certificates are in PEM format
- Check file paths in .env
- Verify certificate is not expired
- Check CUIT matches certificate
- Run `./scripts/verify-certificates.sh`

### Authentication errors

- Clear credential cache: `POST /afip/clear-cache`
- Check system time is synchronized
- Verify AFIP_ENVIRONMENT setting
- Check certificate is not expired
- Verify CUIT in config matches certificate

### Invoice rejected

- Check all amounts add up correctly
- Verify CUIT format (11 digits)
- Ensure IVA breakdown matches total
- Validate invoice type is allowed for your CUIT
- Check that punto de venta is authorized in AFIP
- Verify service dates are provided for concept 2/3

### Connection timeouts

- Check network connectivity to AFIP servers
- Verify firewall allows outbound HTTPS
- Increase timeout in WSFEV1Service if needed
- Check AFIP server status: `GET /afip/status`

## 🛣️ Roadmap

### Phase 1 - Core Functionality ✅ COMPLETE
- [x] WSAA Authentication
- [x] WSFEv1 Electronic Invoicing
- [x] CUIT Validation
- [x] Invoice Formatting
- [x] QR Code Generation
- [x] Invoice Mapper
- [x] Complete Test Suite

### Phase 2 - Advanced Features 🚧 IN PROGRESS
- [ ] Credit/Debit Notes Implementation
- [ ] WSFEX (Export Invoices)
- [ ] Batch Invoice Generation
- [ ] Invoice PDF Generation with QR

### Phase 3 - Production Ready 📋 PLANNED
- [ ] Rate Limiting & Circuit Breaker
- [ ] Automatic Retry Queue
- [ ] AWS Secrets Manager Integration
- [ ] CloudWatch Monitoring
- [ ] Certificate Auto-Renewal

### Phase 4 - Additional Services 💡 FUTURE
- [ ] IIBB (Provincial Taxes)
- [ ] AFIP Taxpayer Registry Query
- [ ] Certificate of Tax Status
- [ ] Automated Compliance Reports

## Implementation Checklist

Use this checklist when deploying AFIP integration:

### Setup Initial
- [ ] Create package @retail/ar
- [ ] Install dependencies
- [ ] Configure file structure
- [ ] Add testing certificates
- [ ] Configure .gitignore for certs/

### Core Services
- [ ] Implement WSAAService (authentication)
- [ ] Implement WSFEV1Service (invoicing)
- [ ] Implement AFIPService (orchestrator)
- [ ] Implement utilities (CUIT, dates, formatting)

### Integration
- [ ] Create AFIPModule
- [ ] Create AFIPController and DTOs
- [ ] Integrate with SalesService
- [ ] Update Prisma schema (if needed)

### Testing
- [ ] Unit tests for CUIT validator
- [ ] Unit tests for date formatter
- [ ] Unit tests for AFIPService
- [ ] Integration tests end-to-end
- [ ] Certificate verification script
- [ ] Connection test script

### Documentation
- [ ] README for package @retail/ar
- [ ] README for certificates
- [ ] API documentation (Swagger)
- [ ] Troubleshooting guide
- [ ] Usage examples

### Production Ready
- [ ] Obtain production certificate from AFIP
- [ ] Configure AWS Secrets Manager for certs
- [ ] Implement retry logic
- [ ] Implement rate limiting
- [ ] Configure monitoring/alerts
- [ ] Document certificate renewal process

## Resources

- [AFIP Web Services Documentation](https://www.afip.gob.ar/ws/)
- [WSFEv1 Specification](https://www.afip.gob.ar/ws/documentacion/ws-factura-electronica.asp)
- [WSAA Specification](https://www.afip.gob.ar/ws/WSAA/Especificacion_Tecnica_WSAA_1.2.2.pdf)
- [RG 5614/2024 - IVA Discriminado](https://www.boletinoficial.gob.ar/)
- [AFIP Homologation Environment](https://wswhomo.afip.gov.ar/)

## Contributing

This is a private package for internal use. For questions or issues:
1. Check the troubleshooting section
2. Review AFIP documentation
3. Contact the development team

## License

Private - Part of Retail Super App monorepo
