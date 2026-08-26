<?php
return [
    'adminEmail' => 'admin@example.com',
    'supportEmail' => 'support@example.com',
    'frontendUrl' => 'http://localhost:3000',
    'mailFrom' => getenv('TESTSITE_MAIL_FROM') ?: 'no-reply@example.com',
    'mailFromName' => getenv('TESTSITE_MAIL_FROM_NAME') ?: 'TestSite',
    'smtpHost' => getenv('TESTSITE_SMTP_HOST') ?: '',
    'smtpPort' => (int) (getenv('TESTSITE_SMTP_PORT') ?: 587),
    'smtpUsername' => getenv('TESTSITE_SMTP_USERNAME') ?: '',
    'smtpPassword' => getenv('TESTSITE_SMTP_PASSWORD') ?: '',
    'smtpEncryption' => getenv('TESTSITE_SMTP_ENCRYPTION') ?: 'tls',
];
