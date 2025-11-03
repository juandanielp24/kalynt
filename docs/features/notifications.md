# Notifications System Documentation

## Overview

The Notifications System is a multi-channel notification infrastructure that supports email, push notifications, in-app notifications, and SMS. Currently, the email provider is fully implemented using Nodemailer and Handlebars templates.

## Features

### Implemented Channels

- ✅ **Email**: Full implementation with HTML templates and nodemailer
- 🚧 **Push Notifications**: Structure ready, implementation pending
- 🚧 **In-App Notifications**: Structure ready, implementation pending
- 🚧 **SMS**: Structure ready, implementation pending

### Email Features

- **Template-based**: Handlebars templates for consistent branding
- **Automatic Sending**: Triggered by system events (sales, low stock, etc.)
- **Manual Sending**: API endpoints for on-demand notifications
- **Configurable SMTP**: Support for MailHog (dev) and production SMTP servers
- **Fail-safe**: Notifications don't block main operations if they fail

## Architecture

### File Structure

```
apps/api/src/modules/notifications/
├── notifications.module.ts          # Module definition
├── notifications.service.ts         # Main service with helper methods
├── notifications.controller.ts      # API endpoints
├── notifications.types.ts           # Shared types and enums
├── providers/
│   ├── email/
│   │   ├── email.provider.ts       # Email implementation (nodemailer)
│   │   ├── email.types.ts          # Email-specific types
│   │   └── templates/              # Handlebars email templates
│   │       ├── welcome.hbs
│   │       ├── sale-receipt.hbs
│   │       ├── low-stock-alert.hbs
│   │       └── password-reset.hbs
│   ├── push/
│   │   ├── push.provider.ts        # Push notifications (TODO)
│   │   └── push.types.ts
│   └── in-app/
│       ├── in-app.provider.ts      # In-app notifications (TODO)
│       └── in-app.types.ts
└── dto/
    └── send-notification.dto.ts    # Validation DTOs
```

## Components

### NotificationsService

Main service that orchestrates all notification channels.

#### Methods

##### Core Methods

```typescript
async send(type: NotificationType, payload: NotificationPayload): Promise<void>
```
Sends a notification through the specified channel.

**Parameters:**
- `type`: Notification channel (EMAIL, PUSH, IN_APP, SMS)
- `payload`: Notification data including recipient, template, and data

**Example:**
```typescript
await notificationsService.send(NotificationType.EMAIL, {
  to: 'customer@example.com',
  template: NotificationTemplate.SALE_RECEIPT,
  data: {
    saleNumber: '00000123',
    total: '$1,234.56',
    // ... more data
  },
});
```

##### Helper Methods

###### sendWelcomeEmail(userId: string)

Sends welcome email when a new user registers.

**Triggered by:** User registration
**Template:** `welcome.hbs`
**Data includes:**
- User name
- User email
- Tenant name
- Plan name
- Dashboard URL

**Example:**
```typescript
await notificationsService.sendWelcomeEmail(newUser.id);
```

###### sendSaleReceipt(saleId: string)

Sends sale receipt to customer email.

**Triggered by:** Sale completion
**Template:** `sale-receipt.hbs`
**Requires:** `sale.customerEmail` must be set
**Data includes:**
- Tenant info (name, CUIT, address)
- Sale number and date
- Invoice details (type, number, CAE)
- Customer info
- Item list with prices
- Totals (subtotal, tax, discount, total)
- Payment method

**Example:**
```typescript
await notificationsService.sendSaleReceipt(completedSale.id);
```

###### sendLowStockAlert(productId: string, locationId: string)

Sends low stock alert to admins and owners.

**Triggered by:** Stock falls below minimum threshold
**Template:** `low-stock-alert.hbs`
**Recipients:** All users with role 'owner' or 'admin' in the tenant
**Data includes:**
- Product name and SKU
- Current stock level
- Minimum stock level
- Location name
- Link to product management

**Example:**
```typescript
await notificationsService.sendLowStockAlert(product.id, location.id);
```

###### sendPasswordResetEmail(email: string, resetToken: string)

Sends password reset link to user.

**Triggered by:** Password reset request
**Template:** `password-reset.hbs`
**Data includes:**
- User name
- Reset URL with token
- Expiration time (24 hours)

**Example:**
```typescript
await notificationsService.sendPasswordResetEmail(user.email, token);
```

### EmailProvider

Handles email sending using nodemailer.

#### Configuration

Configured via environment variables:

```bash
# SMTP Configuration
SMTP_HOST=localhost           # SMTP server host
SMTP_PORT=1025                # SMTP server port (1025 for MailHog)
SMTP_SECURE=false             # Use TLS/SSL
SMTP_USER=                    # SMTP username (optional)
SMTP_PASSWORD=                # SMTP password (optional)
SMTP_FROM=noreply@retail-app.com  # Default sender address

# Application URL
APP_URL=http://localhost:3000  # Used in email links
```

#### Methods

##### send(payload: NotificationPayload)

Sends an email using the specified template.

**Process:**
1. Loads and compiles Handlebars template
2. Renders HTML with provided data
3. Generates subject line based on template
4. Sends email via configured SMTP
5. Logs success/failure

##### verify()

Verifies SMTP connection.

**Returns:** `Promise<boolean>`

**Example:**
```typescript
const isConfigured = await emailProvider.verify();
```

### Templates

#### Template Variables

Each template has access to specific variables passed in the `data` object.

##### welcome.hbs

```handlebars
{{name}}         # User's name
{{email}}        # User's email
{{tenantName}}   # Business/tenant name
{{plan}}         # Subscription plan
{{appUrl}}       # Application URL
```

##### sale-receipt.hbs

```handlebars
{{tenantName}}      # Business name
{{tenantCuit}}      # Tax ID
{{address}}         # Business address
{{saleNumber}}      # Sale number (e.g., "00000123")
{{saleDate}}        # Formatted date
{{invoiceType}}     # A, B, or C
{{invoiceNumber}}   # AFIP invoice number
{{cae}}             # CAE code
{{customerName}}    # Customer name
{{customerCuit}}    # Customer tax ID
{{items}}           # Array of sale items
  {{productName}}   # Item name
  {{quantity}}      # Quantity
  {{unitPrice}}     # Formatted unit price
  {{total}}         # Formatted line total
{{subtotal}}        # Formatted subtotal
{{tax}}             # Formatted tax amount
{{discount}}        # Formatted discount (optional)
{{total}}           # Formatted total
{{paymentMethod}}   # Payment method (translated)
{{websiteUrl}}      # Website URL
```

##### low-stock-alert.hbs

```handlebars
{{productName}}    # Product name
{{sku}}            # Product SKU
{{currentStock}}   # Current stock level
{{minStock}}       # Minimum stock threshold
{{locationName}}   # Location/warehouse name
{{productId}}      # Product ID for link
{{appUrl}}         # Application URL
```

##### password-reset.hbs

```handlebars
{{name}}             # User's name
{{resetUrl}}         # Complete reset URL with token
{{expirationHours}}  # Hours until link expires (24)
```

#### Customizing Templates

To customize a template:

1. Edit the `.hbs` file in `providers/email/templates/`
2. Use Handlebars syntax for variables: `{{variableName}}`
3. Use conditionals: `{{#if variable}}...{{/if}}`
4. Use loops: `{{#each array}}...{{/each}}`
5. Restart the API server to reload templates

**Example - Adding a footer:**

```handlebars
<div style="text-align: center; margin-top: 30px;">
  <p>Follow us:</p>
  <a href="{{socialMedia.facebook}}">Facebook</a> |
  <a href="{{socialMedia.instagram}}">Instagram</a>
</div>
```

## API Endpoints

### POST /notifications/send

Send a manual notification.

**Guards:** `AuthGuard`, `TenantGuard`

**Request Body:**
```typescript
{
  type: 'email' | 'push' | 'in_app' | 'sms',
  to: string,                    // Recipient (email, device token, user ID)
  template: string,              // Template name
  data: Record<string, any>,     // Template data
  priority?: 'high' | 'normal' | 'low',
  scheduleAt?: string            // ISO date string (future feature)
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification sent successfully"
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/notifications/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -d '{
    "type": "email",
    "to": "customer@example.com",
    "template": "sale-receipt",
    "data": {
      "saleNumber": "00000123",
      "total": "$1,234.56"
    }
  }'
```

### GET /notifications/verify-email

Verify email provider configuration.

**Guards:** `AuthGuard`, `TenantGuard`

**Response:**
```json
{
  "success": true,
  "message": "Email provider is configured correctly"
}
```

### POST /notifications/test-email

Send a test email (welcome email) to the current user.

**Guards:** `AuthGuard`, `TenantGuard`

**Headers:**
- `x-user-id`: User ID to send test email to

**Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully"
}
```

## Integration

### Integrating with Other Modules

To send notifications from another module:

1. **Import NotificationsModule:**

```typescript
import { Module, forwardRef } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { NotificationsService } from '../notifications/notifications.service';

@Module({
  imports: [forwardRef(() => NotificationsModule)],
  providers: [
    YourService,
    {
      provide: 'NOTIFICATIONS_SERVICE',
      useExisting: NotificationsService,
    },
  ],
})
export class YourModule {}
```

2. **Inject NotificationsService:**

```typescript
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class YourService {
  constructor(
    @Inject('NOTIFICATIONS_SERVICE')
    private notificationsService?: any
  ) {}

  async yourMethod() {
    // Send notification
    if (this.notificationsService) {
      await this.notificationsService.sendSaleReceipt(saleId);
    }
  }
}
```

**Note:** The optional injection (`notificationsService?`) prevents circular dependency issues and makes the notification system fail-safe.

### Example: Sales Integration

The Sales module already integrates with notifications:

```typescript
// apps/api/src/modules/sales/sales.service.ts

async complete(tenantId: string, saleId: string) {
  // ... sale completion logic ...

  // Send receipt automatically
  if (this.notificationsService && sale.customerEmail) {
    this.notificationsService.sendSaleReceipt(saleId).catch((err) => {
      this.logger.error(`Failed to send receipt: ${err.message}`);
    });
  }

  return completedSale;
}
```

## Development Setup

### Using MailHog for Local Testing

MailHog is a email testing tool that captures all emails sent during development.

#### Install MailHog

**macOS:**
```bash
brew install mailhog
```

**Linux:**
```bash
# Download binary
wget https://github.com/mailhog/MailHog/releases/download/v1.0.1/MailHog_linux_amd64
chmod +x MailHog_linux_amd64
sudo mv MailHog_linux_amd64 /usr/local/bin/mailhog
```

**Docker:**
```bash
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
```

#### Start MailHog

```bash
mailhog
```

MailHog will run on:
- **SMTP**: `localhost:1025`
- **Web UI**: `http://localhost:8025`

#### Configure Application

In your `.env` file:

```bash
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
# Leave SMTP_USER and SMTP_PASSWORD empty for MailHog
SMTP_FROM=noreply@retail-app.com
APP_URL=http://localhost:3000
```

#### View Emails

1. Open `http://localhost:8025` in your browser
2. All sent emails will appear in the inbox
3. Click on an email to view HTML/text content
4. Test email links and formatting

### Testing Notifications

#### Test Welcome Email

```bash
# Create a new user (triggers welcome email)
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

#### Test Sale Receipt

```bash
# Complete a sale with customer email
curl -X POST http://localhost:3001/sales/:saleId/complete \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID"
```

#### Test Low Stock Alert

```bash
# Reduce stock below minimum
curl -X PATCH http://localhost:3001/products/:productId/stock \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "locationId": "loc_123",
    "quantity": 2
  }'
```

## Production Setup

### SMTP Configuration

For production, use a real SMTP provider:

**Gmail (for testing only, not recommended for production):**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Use App Password, not account password
SMTP_FROM=your-email@gmail.com
```

**SendGrid (recommended):**
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com
```

**Amazon SES:**
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-ses-smtp-username
SMTP_PASSWORD=your-ses-smtp-password
SMTP_FROM=noreply@yourdomain.com
```

**Mailgun:**
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@yourdomain.com
SMTP_PASSWORD=your-mailgun-password
SMTP_FROM=noreply@yourdomain.com
```

### Email Verification

Before going to production:

1. **Verify SMTP Connection:**
```bash
curl http://localhost:3001/notifications/verify-email \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID"
```

2. **Send Test Email:**
```bash
curl -X POST http://localhost:3001/notifications/test-email \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "x-user-id: $USER_ID"
```

3. **Check Spam Filters:**
   - Send emails to your own domain
   - Check spam/junk folders
   - Verify SPF, DKIM, DMARC records if using custom domain

### DNS Configuration (Custom Domain)

If using a custom domain for sending emails:

1. **SPF Record:**
```
v=spf1 include:_spf.sendgrid.net ~all
```

2. **DKIM Record:**
(Provided by your email service provider)

3. **DMARC Record:**
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
```

## Error Handling

### Fail-Safe Design

Notifications are designed to never block main operations:

```typescript
// In SalesService
if (this.notificationsService && sale.customerEmail) {
  this.notificationsService.sendSaleReceipt(saleId).catch((err) => {
    this.logger.error(`Failed to send receipt: ${err.message}`);
  });
}
```

**Key points:**
- Notification errors are logged but don't throw
- Optional injection prevents hard dependencies
- `.catch()` prevents unhandled promise rejections
- Sales complete successfully even if email fails

### Common Errors

#### SMTP Connection Failed

**Error:** `Email provider verification failed`

**Solutions:**
1. Check SMTP credentials in `.env`
2. Verify SMTP host and port
3. Check firewall rules
4. For Gmail, use App Password instead of account password

#### Template Not Found

**Error:** `Template X not found`

**Solutions:**
1. Ensure `.hbs` file exists in `templates/` directory
2. Check template name matches enum value
3. Restart API server to reload templates

#### Recipient Email Missing

**Error:** No error, email not sent

**Check:**
- `sale.customerEmail` is set before completing sale
- User email exists in database
- Email format is valid

### Logging

All notification activities are logged:

```
[NotificationsService] Email sent to customer@example.com (sale-receipt)
[EmailProvider] Email provider verified successfully
[SalesService] Failed to send receipt email: SMTP connection timeout
```

Log levels:
- `log`: Successful operations
- `warn`: Missing templates, missing recipient data
- `error`: SMTP failures, template rendering errors
- `debug`: Notification details (verbose mode)

## Future Enhancements

### Planned Features

- [ ] **Push Notifications**
  - Firebase Cloud Messaging integration
  - Device token management
  - Topic-based notifications

- [ ] **In-App Notifications**
  - Real-time notifications via WebSocket
  - Notification center UI
  - Read/unread status
  - Notification preferences

- [ ] **SMS Notifications**
  - Twilio integration
  - Order confirmation
  - OTP/2FA codes

- [ ] **Notification Queue**
  - Bull/Redis queue for reliability
  - Retry failed notifications
  - Rate limiting
  - Scheduled sending

- [ ] **Email Analytics**
  - Open/click tracking
  - Bounce handling
  - Unsubscribe management

- [ ] **Template Management**
  - UI for editing templates
  - Multi-language support
  - A/B testing

- [ ] **User Preferences**
  - Opt-in/opt-out per channel
  - Notification frequency control
  - Quiet hours

### Adding a New Template

1. **Create Template File:**
```bash
touch apps/api/src/modules/notifications/providers/email/templates/new-template.hbs
```

2. **Add to Enum:**
```typescript
// notifications.types.ts
export enum NotificationTemplate {
  // ... existing templates
  NEW_TEMPLATE = 'new-template',
}
```

3. **Register Template:**
```typescript
// email.provider.ts
const templateFiles = {
  // ... existing templates
  [NotificationTemplate.NEW_TEMPLATE]: 'new-template.hbs',
};
```

4. **Add Subject:**
```typescript
// email.provider.ts
private getSubject(template: NotificationTemplate, data: any): string {
  const subjects = {
    // ... existing subjects
    [NotificationTemplate.NEW_TEMPLATE]: `Subject for ${data.something}`,
  };
}
```

5. **Create Helper Method (optional):**
```typescript
// notifications.service.ts
async sendNewNotification(param: string) {
  await this.send(NotificationType.EMAIL, {
    to: 'recipient@example.com',
    template: NotificationTemplate.NEW_TEMPLATE,
    data: {
      // template data
    },
  });
}
```

## Troubleshooting

### Emails Not Sending

1. Check SMTP configuration
2. Verify email provider connection
3. Check application logs
4. Test with MailHog first

### Templates Not Loading

1. Check file path and name
2. Verify template registered in `loadTemplates()`
3. Restart API server
4. Check file permissions

### Images Not Showing

Use absolute URLs for images in templates:
```html
<img src="https://yourdomain.com/images/logo.png" alt="Logo">
```

Or use inline base64 images:
```html
<img src="data:image/png;base64,iVBORw0KG..." alt="Logo">
```

## Support

For issues and questions:
- GitHub Issues: `https://github.com/yourorg/kalynt/issues`
- Email: support@kalynt.com

## License

Copyright © 2025 Kalynt. All rights reserved.
