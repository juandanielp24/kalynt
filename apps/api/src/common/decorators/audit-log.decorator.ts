import { SetMetadata } from '@nestjs/common';

/**
 * AuditLog decorator
 * TODO: Implement audit logging functionality
 * For now, this is a placeholder that sets metadata for future use
 */
export const AUDIT_LOG_KEY = 'audit_log';

export const AuditLog = (resource: string, action: string) =>
  SetMetadata(AUDIT_LOG_KEY, { resource, action });
