import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { PrismaClient } from '@retail/database';
import * as bcrypt from 'bcryptjs';
import { RegisterDto, LoginDto, ResetPasswordDto, ChangePasswordDto } from '../dto';

// Mock bcrypt
jest.mock('bcryptjs');

// Mock data
const mockUser = {
  id: 'user-123',
  tenantId: 'tenant-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'owner',
  emailVerified: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockTenant = {
  id: 'tenant-123',
  name: 'Test Company',
  slug: 'test-company',
  plan: 'free',
  status: 'active',
  country: 'AR',
  currency: 'ARS',
  fiscalCondition: null,
  cuit: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockAccount = {
  id: 'account-123',
  userId: 'user-123',
  accountId: 'user-123',
  providerId: 'credential',
  password: 'hashed-password',
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  scope: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockSession = {
  id: 'session-123',
  userId: 'user-123',
  token: 'session-token-123',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockVerification = {
  id: 'verification-123',
  identifier: 'test@example.com',
  token: 'verification-token-123',
  expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;
  let prisma: jest.Mocked<PrismaClient>;

  beforeEach(async () => {
    // Create mock Prisma client
    const mockPrismaClient = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      tenant: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      location: {
        create: jest.fn(),
      },
      account: {
        create: jest.fn(),
        update: jest.fn(),
      },
      session: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      verification: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: 'PRISMA',
          useValue: mockPrismaClient,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get('PRISMA');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'newuser@example.com',
      password: 'Test@1234',
      name: 'New User',
      tenantName: 'New Company',
      tenantSlug: 'new-company',
      country: 'AR',
      currency: 'ARS',
    };

    it('should successfully register a new user and tenant', async () => {
      // Mock responses
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.tenant.findUnique.mockResolvedValue(null);

      const mockLocation = {
        id: 'location-123',
        tenantId: 'tenant-123',
        name: 'Sucursal Principal',
        type: 'store',
        isActive: true,
      };

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          tenant: {
            create: jest.fn().mockResolvedValue(mockTenant),
          },
          location: {
            create: jest.fn().mockResolvedValue(mockLocation),
          },
          user: {
            create: jest.fn().mockResolvedValue(mockUser),
          },
          account: {
            create: jest.fn().mockResolvedValue(mockAccount),
          },
        });
      });

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tenant');
      expect(result.user.email).toBe(mockUser.email);
      expect(result.tenant.name).toBe(mockTenant.name);
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
    });

    it('should throw ConflictException when email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('Email already registered')
      );

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
    });

    it('should throw ConflictException when tenant slug already exists', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.tenant.findUnique.mockResolvedValue(mockTenant);

      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('Business name already taken')
      );

      expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { slug: registerDto.tenantSlug },
      });
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'Test@1234',
    };

    it('should successfully login with valid credentials', async () => {
      const userWithAccount = {
        ...mockUser,
        accounts: [mockAccount],
        tenant: mockTenant,
      };

      prisma.user.findUnique.mockResolvedValue(userWithAccount);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.session.create.mockResolvedValue(mockSession);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('session');
      expect(result.user.email).toBe(mockUser.email);
      expect(result.session.sessionToken).toBe(mockSession.token);
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockAccount.password);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials')
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const userWithAccount = {
        ...mockUser,
        accounts: [mockAccount],
        tenant: mockTenant,
      };

      prisma.user.findUnique.mockResolvedValue(userWithAccount);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials')
      );
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const inactiveUser = {
        ...mockUser,
        isActive: false,
        accounts: [mockAccount],
        tenant: mockTenant,
      };

      prisma.user.findUnique.mockResolvedValue(inactiveUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Account is disabled')
      );
    });

    it('should throw UnauthorizedException for suspended tenant', async () => {
      const userWithSuspendedTenant = {
        ...mockUser,
        accounts: [mockAccount],
        tenant: { ...mockTenant, status: 'suspended' },
      };

      prisma.user.findUnique.mockResolvedValue(userWithSuspendedTenant);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Account is suspended')
      );
    });
  });

  describe('verifySession', () => {
    const sessionToken = 'valid-session-token';

    it('should successfully verify valid session', async () => {
      const validSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Future date
        user: {
          ...mockUser,
          tenant: mockTenant,
        },
      };

      prisma.session.findUnique.mockResolvedValue(validSession);

      const result = await service.verifySession(sessionToken);

      expect(result).toBeDefined();
      expect(result.token).toBe(mockSession.token);
      expect(result.user.email).toBe(mockUser.email);
    });

    it('should throw UnauthorizedException for invalid session', async () => {
      prisma.session.findUnique.mockResolvedValue(null);

      await expect(service.verifySession(sessionToken)).rejects.toThrow(
        new UnauthorizedException('Invalid session')
      );
    });

    it('should throw UnauthorizedException and delete expired session', async () => {
      const expiredSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() - 1000), // Past date
        user: {
          ...mockUser,
          tenant: mockTenant,
        },
      };

      prisma.session.findUnique.mockResolvedValue(expiredSession);
      prisma.session.delete.mockResolvedValue(expiredSession);

      await expect(service.verifySession(sessionToken)).rejects.toThrow(
        new UnauthorizedException('Session expired')
      );

      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { id: mockSession.id },
      });
    });
  });

  describe('logout', () => {
    it('should successfully logout by deleting session', async () => {
      const sessionToken = 'valid-session-token';
      prisma.session.delete.mockResolvedValue(mockSession);

      const result = await service.logout(sessionToken);

      expect(result.success).toBe(true);
      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { token: sessionToken },
      });
    });
  });

  describe('requestPasswordReset', () => {
    it('should create password reset token for existing user', async () => {
      const email = 'test@example.com';
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.verification.create.mockResolvedValue(mockVerification);

      const result = await service.requestPasswordReset(email);

      expect(result.success).toBe(true);
      expect(result.message).toContain('sent');
      expect(prisma.verification.create).toHaveBeenCalled();
    });

    it('should return success without revealing if email does not exist', async () => {
      const email = 'nonexistent@example.com';
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.requestPasswordReset(email);

      expect(result.success).toBe(true);
      expect(result.message).toContain('If the email exists');
      expect(prisma.verification.create).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    const resetDto: ResetPasswordDto = {
      token: 'valid-reset-token',
      newPassword: 'NewPassword@123',
    };

    it('should successfully reset password with valid token', async () => {
      const userWithAccount = {
        ...mockUser,
        accounts: [mockAccount],
      };

      prisma.verification.findUnique.mockResolvedValue(mockVerification);
      prisma.user.findUnique.mockResolvedValue(userWithAccount);
      prisma.account.update.mockResolvedValue(mockAccount);
      prisma.verification.delete.mockResolvedValue(mockVerification);
      prisma.session.deleteMany.mockResolvedValue({ count: 1 });
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');

      const result = await service.resetPassword(resetDto);

      expect(result.success).toBe(true);
      expect(bcrypt.hash).toHaveBeenCalledWith(resetDto.newPassword, 10);
      expect(prisma.verification.delete).toHaveBeenCalled();
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
      });
    });

    it('should throw BadRequestException for invalid token', async () => {
      prisma.verification.findUnique.mockResolvedValue(null);

      await expect(service.resetPassword(resetDto)).rejects.toThrow(
        new BadRequestException('Invalid or expired token')
      );
    });

    it('should throw BadRequestException for expired token', async () => {
      const expiredVerification = {
        ...mockVerification,
        expiresAt: new Date(Date.now() - 1000), // Past date
      };

      prisma.verification.findUnique.mockResolvedValue(expiredVerification);

      await expect(service.resetPassword(resetDto)).rejects.toThrow(
        new BadRequestException('Invalid or expired token')
      );
    });
  });

  describe('changePassword', () => {
    const changePasswordDto: ChangePasswordDto = {
      currentPassword: 'OldPassword@123',
      newPassword: 'NewPassword@456',
    };

    it('should successfully change password with correct current password', async () => {
      const userWithAccount = {
        ...mockUser,
        accounts: [mockAccount],
      };

      prisma.user.findUnique.mockResolvedValue(userWithAccount);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      prisma.account.update.mockResolvedValue(mockAccount);

      const result = await service.changePassword(mockUser.id, changePasswordDto);

      expect(result.success).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        changePasswordDto.currentPassword,
        mockAccount.password
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(changePasswordDto.newPassword, 10);
    });

    it('should throw BadRequestException for incorrect current password', async () => {
      const userWithAccount = {
        ...mockUser,
        accounts: [mockAccount],
      };

      prisma.user.findUnique.mockResolvedValue(userWithAccount);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword(mockUser.id, changePasswordDto)
      ).rejects.toThrow(new BadRequestException('Current password is incorrect'));
    });
  });

  describe('verifyEmail', () => {
    const verificationToken = 'valid-verification-token';

    it('should successfully verify email with valid token', async () => {
      prisma.verification.findUnique.mockResolvedValue(mockVerification);
      prisma.user.update.mockResolvedValue({ ...mockUser, emailVerified: true });
      prisma.verification.delete.mockResolvedValue(mockVerification);

      const result = await service.verifyEmail(verificationToken);

      expect(result.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email: mockVerification.identifier },
        data: { emailVerified: true },
      });
      expect(prisma.verification.delete).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid token', async () => {
      prisma.verification.findUnique.mockResolvedValue(null);

      await expect(service.verifyEmail(verificationToken)).rejects.toThrow(
        new BadRequestException('Invalid or expired verification token')
      );
    });

    it('should throw BadRequestException for expired token', async () => {
      const expiredVerification = {
        ...mockVerification,
        expiresAt: new Date(Date.now() - 1000), // Past date
      };

      prisma.verification.findUnique.mockResolvedValue(expiredVerification);

      await expect(service.verifyEmail(verificationToken)).rejects.toThrow(
        new BadRequestException('Invalid or expired verification token')
      );
    });
  });
});
