import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '../notifications.service';
import { getQueueToken } from '@nestjs/bull';
import { PrismaClient } from '@retail/database';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let emailQueue: any;
  let prisma: PrismaClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getQueueToken('email'),
          useValue: {
            add: jest.fn(),
          },
        },
        {
          provide: getQueueToken('sms'),
          useValue: {
            add: jest.fn(),
          },
        },
        {
          provide: getQueueToken('push'),
          useValue: {
            add: jest.fn(),
          },
        },
        {
          provide: 'PRISMA',
          useValue: {
            notification: {
              create: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              updateMany: jest.fn(),
              deleteMany: jest.fn(),
            },
            userNotificationPreference: {
              upsert: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: 'SmsService',
          useValue: {},
        },
        {
          provide: 'PushService',
          useValue: {},
        },
        {
          provide: 'InAppService',
          useValue: {
            sendToUser: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    emailQueue = module.get(getQueueToken('email'));
    prisma = module.get('PRISMA');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendEmail', () => {
    it('should queue email notification', async () => {
      const notification = {
        to: 'test@example.com',
        subject: 'Test',
        template: 'welcome',
        context: { name: 'Test' },
      };

      await service.sendEmail(notification);

      expect(emailQueue.add).toHaveBeenCalledWith('send-email', notification, expect.any(Object));
    });
  });

  describe('sendInApp', () => {
    it('should create notification and send via websocket', async () => {
      const notification = {
        userId: 'user-1',
        type: 'info',
        title: 'Test',
        message: 'Test message',
      };

      const mockCreated = {
        id: 'notif-1',
        ...notification,
        createdAt: new Date(),
      };

      jest.spyOn(prisma.notification, 'create').mockResolvedValue(mockCreated as any);

      const result = await service.sendInApp(notification);

      expect(prisma.notification.create).toHaveBeenCalled();
      expect(result.id).toBe('notif-1');
    });
  });

  describe('getUserNotifications', () => {
    it('should return user notifications', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          userId: 'user-1',
          title: 'Test',
          message: 'Test',
          read: false,
          createdAt: new Date(),
        },
      ];

      jest.spyOn(prisma.notification, 'findMany').mockResolvedValue(mockNotifications as any);

      const result = await service.getUserNotifications('user-1');

      expect(result).toEqual(mockNotifications);
    });

    it('should filter unread only', async () => {
      await service.getUserNotifications('user-1', { unreadOnly: true });

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            read: false,
          }),
        }),
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      await service.markAsRead('notif-1', 'user-1');

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'notif-1',
          userId: 'user-1',
        },
        data: {
          read: true,
          readAt: expect.any(Date),
        },
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      jest.spyOn(prisma.notification, 'count').mockResolvedValue(5);

      const result = await service.getUnreadCount('user-1');

      expect(result).toBe(5);
      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          read: false,
        },
      });
    });
  });
});
