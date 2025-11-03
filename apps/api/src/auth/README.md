# Authentication System

Complete authentication system for the Retail Super App using NestJS, session-based authentication, and multi-tenancy support.

## Features

- **Email & Password Authentication**: Secure credential-based authentication with bcrypt password hashing
- **Multi-tenancy**: Automatic tenant creation during registration with unique slugs
- **Session Management**: Cookie-based sessions with 7-day expiration
- **Email Verification**: Token-based email verification system
- **Password Reset**: Secure password reset flow with time-limited tokens
- **Role-Based Access Control (RBAC)**: Guard-based route protection with role verification
- **Security**: CSRF protection, httpOnly cookies, password strength validation
- **Better-auth Integration**: Configured for extensibility with better-auth library

## Architecture

```
auth/
├── auth.config.ts          # Better-auth configuration
├── auth.controller.ts      # REST API endpoints
├── auth.service.ts         # Business logic
├── auth.middleware.ts      # Session verification middleware
├── auth.module.ts          # NestJS module configuration
├── dto/                    # Data Transfer Objects
│   ├── register.dto.ts
│   ├── login.dto.ts
│   └── reset-password.dto.ts
└── __tests__/              # Unit tests
    └── auth.service.spec.ts
```

## Setup

### 1. Install Dependencies

```bash
pnpm add better-auth bcryptjs
pnpm add -D @types/bcryptjs
```

### 2. Environment Variables

Add the following to your `.env` file:

```bash
# App URL for email links
NEXT_PUBLIC_APP_URL=http://localhost:3000

# API URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# Session secret (generate a secure random string)
SESSION_SECRET=your-super-secret-session-key

# Database URL (already configured)
DATABASE_URL=postgresql://...
```

### 3. Database Schema

Ensure your Prisma schema includes the following models:

- `User`: User accounts
- `Tenant`: Multi-tenant organizations
- `Account`: Authentication credentials (better-auth compatible)
- `Session`: Active user sessions
- `Verification`: Email verification and password reset tokens
- `Location`: Default tenant location

### 4. Register Module

In your `app.module.ts`:

```typescript
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // ... other modules
    AuthModule,
  ],
})
export class AppModule {}
```

## API Endpoints

### Public Endpoints

#### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass@123",
  "name": "John Doe",
  "tenantName": "My Company",
  "tenantSlug": "my-company",  // Optional
  "country": "AR",             // Optional
  "cuit": "20-12345678-9",     // Optional (Argentina)
  "fiscalCondition": "monotributo" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "owner"
    },
    "tenant": {
      "id": "uuid",
      "name": "My Company",
      "slug": "my-company"
    }
  }
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass@123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "owner",
      "emailVerified": true,
      "tenantId": "uuid",
      "tenant": {
        "id": "uuid",
        "name": "My Company",
        "slug": "my-company",
        "plan": "free"
      }
    }
  }
}
```

Sets httpOnly cookie: `session_token`

#### Request Password Reset
```http
POST /api/v1/auth/password/request-reset
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Reset Password
```http
POST /api/v1/auth/password/reset
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePass@456"
}
```

#### Verify Email
```http
POST /api/v1/auth/verify-email
Content-Type: application/json

{
  "token": "verification-token-from-email"
}
```

### Protected Endpoints

#### Get Current Session
```http
GET /api/v1/auth/session
Cookie: session_token=...
```

#### Logout
```http
POST /api/v1/auth/logout
Cookie: session_token=...
```

#### Change Password
```http
POST /api/v1/auth/password/change
Cookie: session_token=...
Content-Type: application/json

{
  "currentPassword": "OldPass@123",
  "newPassword": "NewPass@456"
}
```

## Guards and Decorators

### AuthGuard

Protects routes that require authentication:

```typescript
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@/common/guards/auth.guard';

@Controller('products')
export class ProductsController {
  @UseGuards(AuthGuard)
  @Get()
  findAll() {
    // Only authenticated users can access
  }
}
```

### RoleGuard

Protects routes that require specific roles:

```typescript
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@/common/guards/auth.guard';
import { RoleGuard, Roles } from '@/common/guards/role.guard';

@Controller('admin')
@UseGuards(AuthGuard, RoleGuard)
export class AdminController {
  @Roles('owner', 'admin')
  @Get('dashboard')
  getDashboard() {
    // Only owners and admins can access
  }

  @Roles('owner')
  @Delete('users/:id')
  deleteUser() {
    // Only owners can access
  }
}
```

**Available Roles:**
- `owner`: Tenant owner (first user registered)
- `admin`: Administrator
- `manager`: Manager
- `employee`: Regular employee
- `viewer`: Read-only access

### Accessing User in Controllers

The authenticated user is attached to the request:

```typescript
@Get('profile')
@UseGuards(AuthGuard)
getProfile(@Request() req) {
  const user = req.user;      // Current user
  const tenant = req.tenant;  // Current tenant
  return user;
}
```

## Middleware

The `AuthMiddleware` runs on all routes and:
1. Extracts session token from cookies or Authorization header
2. Verifies the session
3. Attaches user and tenant to the request object
4. Does NOT block requests (non-throwing)

Guards use the middleware-attached user to make authorization decisions.

## Security

### Password Requirements

- Minimum 8 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one number
- At least one special character (@$!%*?&)

Validated both on backend (DTO) and frontend (Zod schema).

### Session Security

- **httpOnly cookies**: Not accessible via JavaScript
- **sameSite: lax**: CSRF protection
- **7-day expiration**: Auto-logout after 7 days
- **Secure in production**: HTTPS-only cookies

### Token Security

- **Password reset tokens**: 1-hour expiration
- **Email verification tokens**: 24-hour expiration
- **Cryptographically secure**: Using crypto.randomUUID()

### Best Practices

1. **Never log passwords**: Passwords are hashed immediately
2. **Email enumeration protection**: Password reset doesn't reveal if email exists
3. **Session invalidation**: All sessions deleted on password reset
4. **Rate limiting**: Configure in auth.config.ts (better-auth)
5. **CORS configuration**: Restrict to known origins in production

## Testing

### Unit Tests

```bash
# Run auth service tests
pnpm test auth.service.spec.ts

# With coverage
pnpm test:cov auth.service.spec.ts
```

### E2E Tests

```bash
# Run authentication flow tests
pnpm test:e2e authentication-flow.spec.ts
```

### Manual Testing

1. **Register**: POST to `/auth/register`
2. **Check email**: Verify email verification link (check console logs)
3. **Verify email**: Click link or POST to `/auth/verify-email`
4. **Login**: POST to `/auth/login`
5. **Access protected route**: GET `/auth/session` with cookie
6. **Request password reset**: POST to `/auth/password/request-reset`
7. **Reset password**: Use token from email
8. **Logout**: POST to `/auth/logout`

## Email Integration

The authentication system is ready for email integration but currently logs URLs to console.

### To integrate emails:

1. Install email service (NodeMailer, SendGrid, etc.)
2. Create `NotificationsService`
3. Uncomment email sending in `auth.service.ts`:
   - Line 92: `sendVerificationEmail()`
   - Line 258: `sendPasswordResetEmail()`
4. Configure email templates
5. Set email service credentials in `.env`

### Email Templates Needed

- **Verification Email**: Link to `/verify-email?token=...`
- **Password Reset Email**: Link to `/reset-password?token=...`
- **Welcome Email**: After email verification
- **Password Changed**: Security notification

## Multi-Tenancy

### Tenant Creation

On registration:
1. User provides `tenantName` and optional `tenantSlug`
2. System creates:
   - Tenant with unique slug
   - Default location ("Sucursal Principal")
   - User as "owner" role
   - Account with hashed password

### Tenant Isolation

- `x-tenant-id` header in requests (set by frontend)
- `req.tenant` attached by middleware
- Database queries filtered by `tenantId`
- Row-level security in Prisma queries

## Frontend Integration

The authentication system includes:

- **AuthContext**: React context for auth state
- **ProtectedRoute**: Component for route protection
- **API Client**: Axios with interceptors
- **Auth Pages**: Login, Register, Forgot Password, Reset Password, Verify Email, Unauthorized

See frontend documentation in `apps/web/README.md` for usage.

## Troubleshooting

### "Invalid session" errors

- Check if session token cookie is being sent
- Verify cookie domain and sameSite settings
- Check session hasn't expired (7 days)

### "Email already registered" on registration

- User already exists
- Check if email verification was completed
- Verify database constraints

### Password reset not working

- Check token hasn't expired (1 hour)
- Verify token was copied correctly
- Check console logs for reset URL

### Protected routes not working

- Ensure `AuthMiddleware` is applied globally
- Check `AuthGuard` is added to route
- Verify session token in cookies

### Role-based access failing

- Ensure `RoleGuard` is after `AuthGuard`
- Verify user has required role in database
- Check `@Roles()` decorator is on handler

## Future Enhancements

- [ ] OAuth providers (Google, GitHub, etc.)
- [ ] Two-factor authentication (2FA)
- [ ] Refresh token rotation
- [ ] Account lockout after failed attempts
- [ ] Session management dashboard
- [ ] IP-based security
- [ ] Device tracking
- [ ] Magic link login
- [ ] Biometric authentication (mobile)
- [ ] SSO (Single Sign-On)

## Support

For issues or questions:
1. Check this documentation
2. Review test files for examples
3. Check application logs
4. Contact development team

## License

Proprietary - Retail Super App
