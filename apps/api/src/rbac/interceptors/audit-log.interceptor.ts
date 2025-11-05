import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import { Inject } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';

export const AUDIT_LOG_KEY = 'audit_log';

export interface AuditLogMetadata {
  action: string;
  entity: string;
  description?: string;
}

export const AuditLog = (metadata: AuditLogMetadata) =>
  SetMetadata(AUDIT_LOG_KEY, metadata);

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    @Inject('PRISMA') private prisma: PrismaClient,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditMetadata = this.reflector.getAllAndOverride<AuditLogMetadata>(
      AUDIT_LOG_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!auditMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap(async (data) => {
        // Success - log it
        const duration = Date.now() - startTime;

        try {
          await this.prisma.auditLog.create({
            data: {
              tenantId: user.tenantId,
              userId: user.id,
              roleId: user.roleId,
              action: auditMetadata.action,
              entity: auditMetadata.entity,
              entityId: this.extractResourceId(request, data),
              changes: {
                description: auditMetadata.description,
                method: request.method,
                url: request.url,
                duration,
                data: this.sanitizeData(data),
              },
              ipAddress: request.ip,
              userAgent: request.headers['user-agent'],
              success: true,
            },
          });
        } catch (error) {
          console.error('Failed to create audit log:', error);
        }
      }),
      catchError((error) => {
        // Error - log failure
        this.prisma.auditLog
          .create({
            data: {
              tenantId: user.tenantId,
              userId: user.id,
              roleId: user.roleId,
              action: auditMetadata.action,
              entity: auditMetadata.entity,
              entityId: this.extractResourceId(request, null),
              changes: {
                description: auditMetadata.description,
                method: request.method,
                url: request.url,
              },
              ipAddress: request.ip,
              userAgent: request.headers['user-agent'],
              success: false,
              errorMessage: error.message,
            },
          })
          .catch((logError) => {
            console.error('Failed to create audit log:', logError);
          });

        return throwError(() => error);
      }),
    );
  }

  private extractResourceId(request: any, data: any): string {
    // Try to extract ID from response data
    if (data?.data?.id) return data.data.id;
    if (data?.id) return data.id;

    // Try to extract from request params
    if (request.params?.id) return request.params.id;

    // Generate a placeholder UUID if no ID found
    return '00000000-0000-0000-0000-000000000000';
  }

  private sanitizeData(data: any): any {
    if (!data) return null;

    // Remove sensitive fields
    const sanitized = JSON.parse(JSON.stringify(data));
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];

    const removeSensitive = (obj: any) => {
      if (typeof obj !== 'object' || obj === null) return;

      for (const key of Object.keys(obj)) {
        if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          removeSensitive(obj[key]);
        }
      }
    };

    removeSensitive(sanitized);
    return sanitized;
  }
}
