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

## Database configuration

The active Yii database file is `controllers/config/db.php`. Before running the project locally, rename `db.php` to `db(infinity).php` and rename `db(lokal).php` to `db.php`. Before pushing or deploying to InfinityFree, restore `db(infinity).php` as `db.php`.

The local configuration assumes XAMPP MySQL defaults: host `127.0.0.1`, database `testsite`, username `root`, and an empty password. Set `TESTSITE_DB_HOST`, `TESTSITE_DB_NAME`, `TESTSITE_DB_USERNAME`, and `TESTSITE_DB_PASSWORD` when your local database uses different values.
