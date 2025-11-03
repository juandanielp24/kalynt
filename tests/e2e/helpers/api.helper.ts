import { APIRequestContext } from '@playwright/test';

export class APIHelper {
  constructor(private request: APIRequestContext, private token: string) {}

  private getHeaders(extraHeaders: Record<string, string> = {}) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
      ...extraHeaders,
    };
  }

  async get(url: string, tenantId?: string, userId?: string) {
    return await this.request.get(url, {
      headers: this.getHeaders({
        ...(tenantId && { 'x-tenant-id': tenantId }),
        ...(userId && { 'x-user-id': userId }),
      }),
    });
  }

  async post(
    url: string,
    data: any,
    tenantId?: string,
    userId?: string
  ) {
    return await this.request.post(url, {
      data,
      headers: this.getHeaders({
        ...(tenantId && { 'x-tenant-id': tenantId }),
        ...(userId && { 'x-user-id': userId }),
      }),
    });
  }

  async put(
    url: string,
    data: any,
    tenantId?: string,
    userId?: string
  ) {
    return await this.request.put(url, {
      data,
      headers: this.getHeaders({
        ...(tenantId && { 'x-tenant-id': tenantId }),
        ...(userId && { 'x-user-id': userId }),
      }),
    });
  }

  async delete(url: string, tenantId?: string, userId?: string) {
    return await this.request.delete(url, {
      headers: this.getHeaders({
        ...(tenantId && { 'x-tenant-id': tenantId }),
        ...(userId && { 'x-user-id': userId }),
      }),
    });
  }

  async patch(
    url: string,
    data: any,
    tenantId?: string,
    userId?: string
  ) {
    return await this.request.patch(url, {
      data,
      headers: this.getHeaders({
        ...(tenantId && { 'x-tenant-id': tenantId }),
        ...(userId && { 'x-user-id': userId }),
      }),
    });
  }
}
