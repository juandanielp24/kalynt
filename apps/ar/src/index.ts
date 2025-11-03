/**
 * @retail/ar
 * Argentina-specific functionality for the Retail Super App
 *
 * Includes:
 * - AFIP electronic invoicing integration
 * - Provincial tax calculations (IIBB)
 * - CUIT/CUIL validation
 * - IVA calculations
 */

// AFIP Services
export { AFIPService } from './afip/afip.service';

// AFIP Types
export {
  AFIPConfig,
  AFIPAuthToken,
  AFIPInvoiceType,
  AFIPDocumentType,
  AFIPConceptType,
  AFIPIVACode,
  AFIPInvoiceData,
  AFIPInvoiceResponse,
  InvoiceGenerationRequest,
  FiscalCondition,
  AFIPServerStatus,
  SalesPoint,
} from './afip/afip.types';

// AFIP Configuration
export {
  getAFIPConfig,
  validateAFIPConfig,
  AFIP_URLS,
  getAFIPUrls,
} from './afip/afip.config';

// AFIP Utilities
export {
  validateCUIT,
  formatCUIT,
  cleanCUIT,
  getCUITType,
  extractDNIFromCUIT,
  generateCUITFromDNI,
} from './afip/utils/cuit-validator';

export {
  IVA_RATES,
  calculateIVA,
  calculateNetFromGross,
  extractIVAFromGross,
  getIVACodeFromRate,
  groupByIVARate,
  validateIVAAmounts,
} from './afip/utils/iva-calculator';

export {
  formatInvoiceNumber,
  parseInvoiceNumber,
  validateInvoiceNumber,
  incrementInvoiceNumber,
  generateInvoiceQRData,
} from './afip/utils/invoice-number';

// Tax Services
export { IIBBService, Province, IIBBActivity, IIBB_RATES } from './tax/iibb.service';
