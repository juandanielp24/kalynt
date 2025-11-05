# Environment Variables

Complete list of environment variables for Retail Super App.

## Required Variables

### Database
```env
DATABASE_URL=postgresql://user:password@localhost:5432/retail_db?schema=public
```
PostgreSQL connection string

### Redis
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional_password
```
Redis connection for caching and queues

### Authentication
```env
JWT_SECRET=your-jwt-secret-min-32-chars
BETTER_AUTH_SECRET=your-auth-secret-min-32-chars
```
Secrets for JWT and Better Auth. Generate with:
```bash
openssl rand -base64 32
```

### API Configuration
```env
PORT=3001
NODE_ENV=production
API_URL=https://api.retailsuperapp.com
```

### Frontend Configuration
```env
NEXT_PUBLIC_API_URL=https://api.retailsuperapp.com/api/v1
```

## Optional Variables

### Email (SMTP)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_NAME=Retail Super App
SMTP_FROM_EMAIL=noreply@retailsuperapp.com
```

### SMS (Twilio)
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

### Push Notifications (Firebase)
```env
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
```

### AFIP Integration
```env
AFIP_CUIT=20123456789
AFIP_CERT_PATH=/path/to/cert.pem
AFIP_KEY_PATH=/path/to/key.pem
AFIP_PRODUCTION=false
```

### Mercado Pago
```env
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxx
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxxxxxxxxxx
MERCADOPAGO_WEBHOOK_SECRET=your-webhook-secret
```

### Monitoring
```env
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
SENTRY_ORG=your-org
SENTRY_PROJECT=retail-super-app
```

### AWS (Optional)
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_S3_BUCKET=retail-uploads
AWS_S3_BACKUP_BUCKET=retail-backups
```

### Feature Flags
```env
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_SMS_NOTIFICATIONS=true
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_ANALYTICS=true
```

## Security Best Practices

1. **Never commit .env files** to Git
2. **Use strong secrets**: minimum 32 characters
3. **Rotate secrets regularly**: every 90 days
4. **Use secret management**: AWS Secrets Manager, Vault
5. **Limit access**: only give access to those who need it
6. **Encrypt at rest**: use GPG or similar
7. **Audit access**: log who accesses secrets

## Generating Secrets
```bash
# JWT Secret
openssl rand -base64 32

# Better Auth Secret
openssl rand -base64 32

# Webhook Secret
openssl rand -hex 32
```
