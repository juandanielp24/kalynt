# AFIP/ARCA Integration Guide

## 🚨 CRITICAL: This integration is MANDATORY for legal operation in Argentina

---

## Implementation Status

### ✅ Completed (Phase 1)

1. **Package Structure**
   - ✅ Created `@retail/ar` package in workspace
   - ✅ Configured package.json with dependencies
   - ✅ Set up TypeScript configuration
   - ✅ Created directory structure for AFIP module

2. **Certificate Management**
   - ✅ Created secure certificate directory with .gitignore
   - ✅ Documented certificate setup process
   - ✅ Added README with instructions for dev/prod certificates

3. **Constants & Types**
   - ✅ AFIP URLs (testing & production)
   - ✅ Invoice types (A, B, C, M, Credit/Debit notes)
   - ✅ Document types (CUIT, CUIL, DNI, etc.)
   - ✅ Concept types (Products, Services, Mixed)
   - ✅ IVA conditions and rates
   - ✅ Currency codes
   - ✅ Error codes
   - ✅ Province codes
   - ✅ WSAA types (authentication)
   - ✅ WSFEv1 types (invoicing)

4. **Utilities**
   - ✅ **CuitValidator**: Complete CUIT/CUIL validation
     - Validation with check digit
     - Format/clean functions
     - Generate CUIT from DNI
     - Extract DNI from CUIT
     - Determine person type (física/jurídica)

   - ✅ **DateFormatter**: AFIP date handling
     - Format to AFIP standard (YYYYMMDD)
     - Format to WSAA standard (ISO)
     - Parse from AFIP format
     - CAE expiration calculation
     - Argentina timezone handling

   - ✅ **InvoiceFormatter**: Invoice formatting
     - Format invoice numbers
     - Calculate IVA amounts
     - Validate amount calculations
     - Get invoice type names

### 🔨 To Be Implemented (Phase 2)

1. **WSAA Service** (Authentication)
   - Generate Login Ticket Request (LTR)
   - Sign LTR with certificate
   - Call WSAA web service
   - Parse and store credentials (token + sign)
   - Handle token expiration and renewal

2. **WSFEv1 Service** (Electronic Invoicing)
   - Check AFIP server status
   - Get last invoice number
   - Generate invoices (A, B, C)
   - Query invoice information
   - Handle CAE (Electronic Authorization Code)

3. **AFIP Service Facade**
   - High-level API for invoice generation
   - Integration with database (save invoices)
   - Error handling and logging
   - Retry logic for transient failures

4. **Controller & DTOs**
   - REST endpoints for invoice generation
   - Input validation with class-validator
   - Response formatting

5. **Tests**
   - Unit tests for utilities
   - Integration tests with AFIP testing environment
   - Mock tests for services

---

## Directory Structure

```
apps/ar/
├── package.json               ✅ Created
├── tsconfig.json              ✅ Created
├── src/
│   ├── index.ts               ⏳ To create
│   ├── afip/
│   │   ├── afip.module.ts     ⏳ To create
│   │   ├── afip.service.ts    ⏳ To create
│   │   ├── afip.controller.ts ⏳ To create
│   │   ├── wsaa/
│   │   │   ├── wsaa.service.ts    ⏳ To create
│   │   │   └── wsaa.types.ts      ✅ Created
│   │   ├── wsfev1/
│   │   │   ├── wsfev1.service.ts  ⏳ To create
│   │   │   └── wsfev1.types.ts    ✅ Created
│   │   ├── dto/
│   │   │   ├── generate-invoice.dto.ts  ⏳ To create
│   │   │   └── invoice-query.dto.ts     ⏳ To create
│   │   ├── utils/
│   │   │   ├── cuit-validator.ts        ✅ Created
│   │   │   ├── invoice-formatter.ts     ✅ Created
│   │   │   └── date-formatter.ts        ✅ Created
│   │   └── __tests__/
│   │       ├── afip.service.spec.ts         ⏳ To create
│   │       └── cuit-validator.spec.ts       ⏳ To create
│   ├── tax/
│   │   ├── iibb.service.ts                  ⏳ Future
│   │   └── tax-calculator.ts                ⏳ Future
│   └── constants/
│       └── argentina.constants.ts           ✅ Created
├── certs/
│   ├── .gitignore             ✅ Created
│   ├── README.md              ✅ Created
│   └── (certificates)         ⏳ To obtain
└── README.md                  ⏳ To create
```

---

## Quick Start

### 1. Install Dependencies

Dependencies are already installed via workspace root:

```bash
cd /path/to/kalynt
pnpm install
```

### 2. Obtain AFIP Testing Certificate

For development, you need a testing certificate:

```bash
# Generate private key
cd apps/ar/certs
openssl genrsa -out key-test.pem 2048

# Generate CSR
openssl req -new -key key-test.pem -out cert-test.csr \
  -subj "/C=AR/O=Test/CN=testing/serialNumber=CUIT 20409378472"
```

Then upload the CSR to AFIP testing environment to get the signed certificate.

**For quick testing**, you can use AFIP's testing CUIT: `20409378472`

### 3. Configure Environment Variables

```env
# .env
AFIP_ENVIRONMENT=testing
AFIP_CERT_PATH=./apps/ar/certs/cert-test.pem
AFIP_KEY_PATH=./apps/ar/certs/key-test.pem
AFIP_CUIT=20409378472
AFIP_SALE_POINT=1
```

---

## Implementation Guide

### Phase 2: Core Services (Next Steps)

#### 1. WSAA Service Implementation

Create `apps/ar/src/afip/wsaa/wsaa.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as crypto from 'crypto';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { AFIP_URLS, TOKEN_TTL } from '../../constants/argentina.constants';
import { WSAACredentials } from './wsaa.types';
import { DateFormatter } from '../utils/date-formatter';

@Injectable()
export class WSAAService {
  private credentials: WSAACredentials | null = null;

  constructor(private config: ConfigService) {}

  async getCredentials(service: string = 'wsfe'): Promise<WSAACredentials> {
    // Check if we have valid credentials
    if (this.credentials && this.credentials.expirationTime > new Date()) {
      return this.credentials;
    }

    // Generate new credentials
    return this.authenticate(service);
  }

  private async authenticate(service: string): Promise<WSAACredentials> {
    // 1. Generate Login Ticket Request (LTR)
    const ltr = this.generateLTR(service);

    // 2. Sign LTR with certificate
    const cms = this.signLTR(ltr);

    // 3. Call WSAA
    const response = await this.callWSAA(cms);

    // 4. Parse and store credentials
    this.credentials = await this.parseWSAAResponse(response);

    return this.credentials;
  }

  private generateLTR(service: string): string {
    const uniqueId = Date.now();
    const generationTime = DateFormatter.toWSAAFormat();
    const expirationTime = DateFormatter.toWSAAFormat(
      new Date(Date.now() + TOKEN_TTL * 1000)
    );

    return \`<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
  <header>
    <uniqueId>\${uniqueId}</uniqueId>
    <generationTime>\${generationTime}</generationTime>
    <expirationTime>\${expirationTime}</expirationTime>
  </header>
  <service>\${service}</service>
</loginTicketRequest>\`;
  }

  private signLTR(ltr: string): string {
    const certPath = this.config.get<string>('AFIP_CERT_PATH');
    const keyPath = this.config.get<string>('AFIP_KEY_PATH');

    const cert = fs.readFileSync(certPath);
    const key = fs.readFileSync(keyPath);

    const sign = crypto.createSign('SHA256');
    sign.update(ltr);
    const signature = sign.sign(key, 'base64');

    // Create PKCS#7 CMS
    // Note: This is simplified - actual implementation needs proper CMS generation
    return \`-----BEGIN PKCS7-----
\${signature}
-----END PKCS7-----\`;
  }

  private async callWSAA(cms: string): Promise<string> {
    const environment = this.config.get<string>('AFIP_ENVIRONMENT', 'testing');
    const url = AFIP_URLS[environment].wsaa;

    const soapEnvelope = \`<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsaa="http://wsaa.view.sua.dvadac.desein.afip.gov">
  <soapenv:Header/>
  <soapenv:Body>
    <wsaa:loginCms>
      <wsaa:in0>\${cms}</wsaa:in0>
    </wsaa:loginCms>
  </soapenv:Body>
</soapenv:Envelope>\`;

    const response = await axios.post(url, soapEnvelope, {
      headers: {
        'Content-Type': 'text/xml',
        'SOAPAction': '',
      },
    });

    return response.data;
  }

  private async parseWSAAResponse(xml: string): Promise<WSAACredentials> {
    const parsed = await parseStringPromise(xml);

    const loginResponse = parsed['soapenv:Envelope']['soapenv:Body'][0]['loginCmsResponse'][0];
    const loginReturn = loginResponse['loginCmsReturn'][0];

    const token = loginReturn['token'][0];
    const sign = loginReturn['sign'][0];
    const expirationTime = new Date(loginReturn['header'][0]['expirationTime'][0]);

    return {
      token,
      sign,
      expirationTime,
    };
  }
}
```

#### 2. WSFEv1 Service Implementation

Create `apps/ar/src/afip/wsfev1/wsfev1.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { WSAAService } from '../wsaa/wsaa.service';
import { AFIP_URLS } from '../../constants/argentina.constants';
import { InvoiceRequest, InvoiceResponse, LastInvoiceResponse } from './wsfev1.types';

@Injectable()
export class WSFEv1Service {
  constructor(
    private config: ConfigService,
    private wsaaService: WSAAService
  ) {}

  async getLastInvoiceNumber(
    invoiceType: number,
    salePoint: number
  ): Promise<number> {
    const credentials = await this.wsaaService.getCredentials('wsfe');
    const cuit = this.config.get<string>('AFIP_CUIT');

    const soapBody = \`
    <FECompUltimoAutorizado xmlns="http://ar.gov.afip.dif.FEV1/">
      <Auth>
        <Token>\${credentials.token}</Token>
        <Sign>\${credentials.sign}</Sign>
        <Cuit>\${cuit}</Cuit>
      </Auth>
      <PtoVta>\${salePoint}</PtoVta>
      <CbteTipo>\${invoiceType}</CbteTipo>
    </FECompUltimoAutorizado>\`;

    const response = await this.callWS('FECompUltimoAutorizado', soapBody);
    const parsed = await this.parseResponse(response);

    return parseInt(parsed.FECompUltimoAutorizadoResponse.FECompUltimoAutorizadoResult.CbteNro);
  }

  async generateInvoice(invoice: InvoiceRequest): Promise<InvoiceResponse> {
    const credentials = await this.wsaaService.getCredentials('wsfe');
    const cuit = this.config.get<string>('AFIP_CUIT');

    // Build SOAP request
    const soapBody = this.buildInvoiceRequest(credentials, cuit, invoice);

    // Call AFIP
    const response = await this.callWS('FECAESolicitar', soapBody);

    // Parse response
    return this.parseInvoiceResponse(response);
  }

  private buildInvoiceRequest(credentials: any, cuit: string, invoice: InvoiceRequest): string {
    // Build complete SOAP body
    // This is complex - see AFIP documentation
    return \`<!-- SOAP body for invoice generation -->\`;
  }

  private async callWS(method: string, body: string): Promise<string> {
    const environment = this.config.get<string>('AFIP_ENVIRONMENT', 'testing');
    const url = AFIP_URLS[environment].wsfev1;

    const soapEnvelope = \`<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:ar="http://ar.gov.afip.dif.FEV1/">
  <soap:Header/>
  <soap:Body>
    \${body}
  </soap:Body>
</soap:Envelope>\`;

    const response = await axios.post(url, soapEnvelope, {
      headers: {
        'Content-Type': 'application/soap+xml',
      },
    });

    return response.data;
  }

  private async parseResponse(xml: string): Promise<any> {
    return await parseStringPromise(xml);
  }

  private parseInvoiceResponse(xml: string): InvoiceResponse {
    // Parse AFIP response
    // Extract CAE, errors, observations
    return {} as InvoiceResponse;
  }
}
```

---

## Testing

### Unit Tests Example

Create `apps/ar/src/afip/__tests__/cuit-validator.spec.ts`:

```typescript
import { CuitValidator } from '../utils/cuit-validator';

describe('CuitValidator', () => {
  describe('validate', () => {
    it('should validate correct CUIT', () => {
      expect(CuitValidator.validate('20-40937847-2')).toBe(true);
      expect(CuitValidator.validate('20409378472')).toBe(true);
    });

    it('should reject invalid CUIT', () => {
      expect(CuitValidator.validate('20-40937847-1')).toBe(false);
      expect(CuitValidator.validate('12345678901')).toBe(false);
    });

    it('should reject malformed CUIT', () => {
      expect(CuitValidator.validate('123')).toBe(false);
      expect(CuitValidator.validate('abcdefghijk')).toBe(false);
    });
  });

  describe('format', () => {
    it('should format CUIT with hyphens', () => {
      expect(CuitValidator.format('20409378472')).toBe('20-40937847-2');
    });
  });

  describe('generateFromDNI', () => {
    it('should generate valid CUIT from DNI', () => {
      const cuit = CuitValidator.generateFromDNI('40937847', 'M');
      expect(CuitValidator.validate(cuit)).toBe(true);
      expect(cuit.startsWith('20')).toBe(true);
    });
  });
});
```

---

## Integration with Main API

### 1. Add to AppModule

```typescript
// apps/api/src/app.module.ts
import { AFIPModule } from '@retail/ar';

@Module({
  imports: [
    // ... other modules
    AFIPModule.register({
      environment: process.env.AFIP_ENVIRONMENT,
      certPath: process.env.AFIP_CERT_PATH,
      keyPath: process.env.AFIP_KEY_PATH,
      cuit: process.env.AFIP_CUIT,
    }),
  ],
})
export class AppModule {}
```

### 2. Use in Sales Service

```typescript
// apps/api/src/modules/sales/sales.service.ts
import { AFIPService } from '@retail/ar';

@Injectable()
export class SalesService {
  constructor(private afipService: AFIPService) {}

  async createSale(data: CreateSaleDto) {
    // Create sale in database
    const sale = await this.createSaleInDB(data);

    // Generate AFIP invoice
    if (needsAFIPInvoice(data)) {
      const afipResult = await this.afipService.generateInvoice({
        invoiceType: sale.invoiceType,
        salePoint: sale.salePoint,
        customer: sale.customer,
        items: sale.items,
        total: sale.total,
      });

      // Update sale with CAE
      await this.updateSaleWithCAE(sale.id, afipResult.cae, afipResult.caeExpirationDate);
    }

    return sale;
  }
}
```

---

## Production Checklist

Before going to production:

### 1. Certificates
- [ ] Obtain production certificates from AFIP
- [ ] Store certificates securely (AWS Secrets Manager, etc.)
- [ ] Configure automatic renewal alerts (3 years expiration)
- [ ] Test certificate loading in production environment

### 2. Configuration
- [ ] Set AFIP_ENVIRONMENT=production
- [ ] Configure production CUIT
- [ ] Set up production sale points
- [ ] Configure retry logic for AFIP failures

### 3. Error Handling
- [ ] Implement comprehensive error handling
- [ ] Log all AFIP requests/responses
- [ ] Set up alerts for AFIP failures
- [ ] Implement fallback for AFIP downtime

### 4. Testing
- [ ] Test all invoice types (A, B, C)
- [ ] Test with real tax conditions
- [ ] Verify IVA calculations
- [ ] Test credit/debit notes
- [ ] Load test invoice generation

### 5. Compliance
- [ ] Verify RG 5614/2024 compliance (IVA discrimination)
- [ ] Ensure correct invoice numbering
- [ ] Validate all mandatory fields
- [ ] Test CAE expiration handling

---

## Resources

- **AFIP Documentation**: http://www.afip.gob.ar/ws/
- **WSFEv1 Manual**: [Download PDF]
- **WSAA Manual**: [Download PDF]
- **Testing Environment**: https://wswhomo.afip.gov.ar/
- **Production Environment**: https://servicios1.afip.gov.ar/

---

## Support

For issues with AFIP integration:
1. Check AFIP service status: http://www.afip.gob.ar/ws/
2. Review error codes in `argentina.constants.ts`
3. Check logs for detailed error messages
4. Consult AFIP technical support (for production issues)

---

**Last Updated**: 2025-11-03
**Status**: Phase 1 Complete, Phase 2 Ready to Implement
