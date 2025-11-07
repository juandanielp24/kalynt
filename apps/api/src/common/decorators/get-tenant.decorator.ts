import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * GetTenant decorator
 * Extracts the tenantId from the authenticated user in the request
 */
export const GetTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.tenantId) {
      throw new Error('Tenant ID not found in request');
    }

    return user.tenantId;
  },
);
