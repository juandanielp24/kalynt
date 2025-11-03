# MailHog Setup for Email Testing

## Overview

MailHog is an email testing tool for developers. It acts as a fake SMTP server that captures all outgoing emails, allowing you to test email functionality without sending real emails.

## Features

- **SMTP Server**: Captures all emails sent to localhost:1025
- **Web Interface**: View captured emails at http://localhost:8025
- **No Configuration**: Works out of the box with default settings
- **Safe Testing**: Emails never leave your machine
- **HTML Preview**: View rendered HTML emails
- **JSON API**: Programmatic access to emails

## Installation

### macOS (Homebrew)

```bash
brew install mailhog
```

### Linux

```bash
# Download binary
wget https://github.com/mailhog/MailHog/releases/download/v1.0.1/MailHog_linux_amd64

# Make executable
chmod +x MailHog_linux_amd64

# Move to system bin
sudo mv MailHog_linux_amd64 /usr/local/bin/mailhog
```

### Windows

Download from: https://github.com/mailhog/MailHog/releases

Or use Docker (see below).

### Docker

```bash
docker run -d \
  -p 1025:1025 \
  -p 8025:8025 \
  --name mailhog \
  mailhog/mailhog
```

## Running MailHog

### Start MailHog

```bash
mailhog
```

You should see output like:
```
[HTTP] Binding to address: 0.0.0.0:8025
[SMTP] Binding to address: 0.0.0.0:1025
```

### Keep Running in Background

**macOS/Linux:**
```bash
# Start in background
mailhog &

# Or use nohup
nohup mailhog > /dev/null 2>&1 &
```

**macOS (Homebrew Services):**
```bash
# Start as a service
brew services start mailhog

# Stop service
brew services stop mailhog

# Restart service
brew services restart mailhog
```

**Docker:**
```bash
# Already running in background with -d flag
docker start mailhog
docker stop mailhog
```

### Check if Running

```bash
# Check process
ps aux | grep mailhog

# Check HTTP interface
curl http://localhost:8025
```

## Configuration

### Application Setup

In `apps/api/.env`:

```bash
# Email / Notifications
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@retail-app.com
APP_URL=http://localhost:3000
```

**Important:**
- Leave `SMTP_USER` and `SMTP_PASSWORD` empty for MailHog
- `SMTP_SECURE` must be `false`
- Port `1025` for SMTP (not standard 25/587)

### Verify Connection

```bash
# From API
curl http://localhost:3001/notifications/verify-email \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID"
```

Expected response:
```json
{
  "success": true,
  "message": "Email provider is configured correctly"
}
```

## Using MailHog

### Web Interface

1. Open browser: http://localhost:8025
2. View list of captured emails
3. Click email to view:
   - HTML preview
   - Plain text version
   - Raw source
   - Headers

### Testing Emails

#### Send Test Email

```bash
curl -X POST http://localhost:3001/notifications/test-email \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "x-user-id: $USER_ID"
```

Check MailHog interface - email should appear immediately.

#### Trigger Welcome Email

Register a new user:

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "tenantName": "Test Business"
  }'
```

Check MailHog - welcome email should appear.

#### Trigger Sale Receipt

Complete a sale with customer email:

```bash
# 1. Create sale
curl -X POST http://localhost:3001/sales \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "x-user-id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "locationId": "loc_123",
    "customerEmail": "customer@example.com",
    "items": [...]
  }'

# 2. Complete sale (triggers email)
curl -X POST http://localhost:3001/sales/{saleId}/complete \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID"
```

Check MailHog - receipt should appear.

### API Access

MailHog provides a JSON API:

```bash
# Get all messages
curl http://localhost:8025/api/v2/messages

# Get specific message
curl http://localhost:8025/api/v2/messages/{id}

# Delete all messages
curl -X DELETE http://localhost:8025/api/v1/messages

# Delete specific message
curl -X DELETE http://localhost:8025/api/v1/messages/{id}
```

### Command Line Access

```bash
# List messages (requires jq)
curl -s http://localhost:8025/api/v2/messages | jq '.items[] | {from: .From, to: .To, subject: .Content.Headers.Subject[0]}'

# Get latest message
curl -s http://localhost:8025/api/v2/messages | jq '.items[0]'

# Clear all messages
curl -X DELETE http://localhost:8025/api/v1/messages
```

## Troubleshooting

### MailHog Not Starting

**Error:** `bind: address already in use`

**Solution:**
```bash
# Find process using port 1025
lsof -i :1025

# Kill it
kill -9 <PID>

# Or use different port
mailhog -smtp-bind-addr :1026
```

### Emails Not Appearing

1. **Check MailHog is Running:**
```bash
curl http://localhost:8025
```

2. **Check Application Config:**
```bash
# Should be localhost:1025
echo $SMTP_HOST
echo $SMTP_PORT
```

3. **Check Application Logs:**
```bash
# Should see: "Email sent to..."
tail -f apps/api/logs/app.log
```

4. **Test Direct Connection:**
```bash
telnet localhost 1025
# Type: EHLO localhost
# Should get: 250-Hello localhost
```

### HTML Not Rendering

- MailHog shows HTML by default
- Use "Switch to plain text" button to toggle
- If images broken, check image URLs are absolute

### Large Emails Slow

MailHog keeps all emails in memory:
- Click "Clear" button to delete all
- Or use API: `curl -X DELETE http://localhost:8025/api/v1/messages`

## Development Workflow

### Typical Setup

```bash
# Terminal 1: Start MailHog
mailhog

# Terminal 2: Start API
cd apps/api
pnpm dev

# Terminal 3: Run tests
pnpm test

# Browser: View emails
open http://localhost:8025
```

### Automated Testing

```javascript
// Example test with MailHog API
describe('Email notifications', () => {
  beforeEach(async () => {
    // Clear MailHog before each test
    await fetch('http://localhost:8025/api/v1/messages', {
      method: 'DELETE',
    });
  });

  it('sends welcome email on registration', async () => {
    // Register user
    await registerUser({
      email: 'test@example.com',
      name: 'Test User',
    });

    // Check MailHog for email
    const response = await fetch('http://localhost:8025/api/v2/messages');
    const { items } = await response.json();

    expect(items).toHaveLength(1);
    expect(items[0].To[0].Mailbox).toBe('test');
    expect(items[0].To[0].Domain).toBe('example.com');
    expect(items[0].Content.Headers.Subject[0]).toContain('Bienvenido');
  });
});
```

## Production Transition

When moving to production, update `.env`:

```bash
# Production SMTP (example: SendGrid)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=SG.your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com
APP_URL=https://yourdomain.com
```

**No code changes required** - just environment variables.

## Resources

- **MailHog GitHub**: https://github.com/mailhog/MailHog
- **API Docs**: https://github.com/mailhog/MailHog/blob/master/docs/APIv2.md
- **Docker Hub**: https://hub.docker.com/r/mailhog/mailhog

## Tips

- **Keep MailHog running**: Add to your development startup script
- **Clear regularly**: Delete old emails to keep interface fast
- **Use real emails**: Test with your own email addresses
- **Test all templates**: Ensure all notification types work
- **Check spam**: Some email clients mark MailHog emails as spam
- **Test mobile**: View emails on mobile devices for responsive design

## Support

For issues with MailHog:
- GitHub Issues: https://github.com/mailhog/MailHog/issues

For application email issues:
- See: `docs/features/notifications.md`
- Check logs: `apps/api/logs/`
- Test endpoint: `GET /notifications/verify-email`
