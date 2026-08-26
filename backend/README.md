# TestSite Backend

Yii2 backend for authentication, API, and database management.

## Confirmation email SMTP

Confirmation emails use PHPMailer and authenticated SMTP. Before starting Apache, set these environment variables in Windows:

```powershell
$env:TESTSITE_SMTP_HOST = 'smtp.gmail.com'
$env:TESTSITE_SMTP_PORT = '587'
$env:TESTSITE_SMTP_USERNAME = 'your-email@gmail.com'
$env:TESTSITE_SMTP_PASSWORD = 'your-gmail-app-password'
$env:TESTSITE_SMTP_ENCRYPTION = 'tls'
$env:TESTSITE_MAIL_FROM = 'your-email@gmail.com'
$env:TESTSITE_MAIL_FROM_NAME = 'TestSite'
```

For Gmail, use a Google App Password, not the normal account password. The same values must be available to the Apache PHP process. Do not commit SMTP credentials to the repository.

## Structure

- `controllers/` - API controllers
- `models/` - ActiveRecord models
- `config/` - application configuration
- `web/` - web entry point
- `migrations/` - database migrations
