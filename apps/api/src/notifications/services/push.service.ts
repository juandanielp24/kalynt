import { Injectable, Logger, Inject } from '@nestjs/common';
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import * as admin from 'firebase-admin';
import { PrismaClient } from '@retail/database';
import { PushNotification } from '../notifications.service';

@Injectable()
@Processor('push')
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private firebaseApp: admin.app.App | null = null;

  constructor(@Inject('PRISMA') private prisma: PrismaClient) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

      if (!serviceAccount) {
        this.logger.warn(
          'Firebase credentials not configured. Push notifications disabled.',
        );
        return;
      }

      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccount)),
      });

      this.logger.log('Firebase initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase:', error);
    }
  }

  @Process('send-push')
  async handleSendPush(job: Job<PushNotification>) {
    const { data } = job;

    if (!this.firebaseApp) {
      this.logger.warn('Push notification skipped - Firebase not configured');
      return { success: false, reason: 'not_configured' };
    }

    this.logger.log(`Sending push notification to user ${data.userId}`);

    try {
      // Get user's FCM tokens
      const tokens = await this.prisma.deviceToken.findMany({
        where: {
          userId: data.userId,
          isActive: true,
        },
        select: {
          token: true,
        },
      });

      if (tokens.length === 0) {
        this.logger.warn(`No FCM tokens found for user ${data.userId}`);
        return { success: false, reason: 'no_tokens' };
      }

      const message: admin.messaging.MulticastMessage = {
        notification: {
          title: data.title,
          body: data.body,
        },
        data: data.data || {},
        tokens: tokens.map((t) => t.token),
      };

      const result = await admin.messaging().sendEachForMulticast(message);

      this.logger.log(
        `Push notification sent. Success: ${result.successCount}, Failed: ${result.failureCount}`,
      );

      // Remove invalid tokens
      if (result.failureCount > 0) {
        const failedTokens: string[] = [];
        result.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx].token);
          }
        });

        await this.prisma.deviceToken.updateMany({
          where: {
            token: { in: failedTokens },
          },
          data: {
            isActive: false,
          },
        });
      }

      return {
        success: true,
        successCount: result.successCount,
        failureCount: result.failureCount,
      };
    } catch (error) {
      this.logger.error(`Failed to send push notification:`, error);
      throw error;
    }
  }

  /**
   * Register device token
   */
  async registerDeviceToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android',
  ) {
    return this.prisma.deviceToken.upsert({
      where: {
        userId_token: {
          userId,
          token,
        },
      },
      create: {
        userId,
        token,
        platform,
        isActive: true,
      },
      update: {
        isActive: true,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Unregister device token
   */
  async unregisterDeviceToken(userId: string, token: string) {
    return this.prisma.deviceToken.updateMany({
      where: {
        userId,
        token,
      },
      data: {
        isActive: false,
      },
    });
  }
}
