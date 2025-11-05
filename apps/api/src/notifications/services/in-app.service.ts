import { Injectable } from '@nestjs/common';
import { NotificationsGateway } from '../notifications.gateway';

@Injectable()
export class InAppService {
  constructor(private notificationsGateway: NotificationsGateway) {}

  /**
   * Send notification to specific user
   */
  async sendToUser(userId: string, data: any) {
    this.notificationsGateway.sendToUser(userId, 'notification', data);
  }

  /**
   * Send notification to all users in tenant
   */
  async sendToTenant(tenantId: string, data: any) {
    this.notificationsGateway.sendToTenant(tenantId, 'notification', data);
  }

  /**
   * Broadcast to all connected users
   */
  async broadcast(data: any) {
    this.notificationsGateway.broadcast('notification', data);
  }
}
