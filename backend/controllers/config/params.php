<?php
return [
    'adminEmail' => getenv('TESTSITE_ADMIN_EMAIL') ?: 'leyharviep@gmail.com',
    'supportEmail' => 'support@example.com',
    'contactRecipient' => getenv('TESTSITE_CONTACT_RECIPIENT') ?: (getenv('TESTSITE_MAIL_FROM') ?: ''),
    'frontendUrl' => rtrim(getenv('TESTSITE_FRONTEND_URL') ?: 'http://localhost:3000', '/'),
    'mailFrom' => getenv('TESTSITE_MAIL_FROM') ?: 'no-reply@example.com',
    'mailFromName' => getenv('TESTSITE_MAIL_FROM_NAME') ?: 'TestSite',
    'smtpHost' => getenv('TESTSITE_SMTP_HOST') ?: '',
    'smtpPort' => (int) (getenv('TESTSITE_SMTP_PORT') ?: 587),
    'smtpUsername' => getenv('TESTSITE_SMTP_USERNAME') ?: '',
    'smtpPassword' => getenv('TESTSITE_SMTP_PASSWORD') ?: '',
    'smtpEncryption' => getenv('TESTSITE_SMTP_ENCRYPTION') ?: 'tls',
];
