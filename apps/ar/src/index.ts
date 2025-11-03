/**
 * @retail/ar
 * Argentina-specific functionality for the Retail Super App
 *
 * Includes:
 * - AFIP electronic invoicing integration (WSAA + WSFEv1)
 * - Provincial tax calculations (IIBB)
 * - CUIT/CUIL validation
 * - IVA calculations
 * - Date formatting utilities
 * - Invoice formatting utilities
 */

// Export all AFIP functionality
export * from './afip';

// Export Argentina constants
export * from './constants/argentina.constants';

// Tax Services (if exists)
// export * from './tax/iibb.service';
