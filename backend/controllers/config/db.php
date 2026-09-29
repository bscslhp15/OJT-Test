<?php

$databaseHost = getenv('TESTSITE_DB_HOST') ?: 'sql302.infinityfree.com';
$databaseName = getenv('TESTSITE_DB_NAME') ?: 'if0_42977499_TestSite';
$databaseUser = getenv('TESTSITE_DB_USERNAME') ?: 'if0_42977499';
$databasePassword = getenv('TESTSITE_DB_PASSWORD') ?: 'KR4xF760xSCBy';

return [
    'class' => 'yii\db\Connection',
    'dsn' => "mysql:host={$databaseHost};dbname={$databaseName}",
    'username' => $databaseUser,
    'password' => $databasePassword,
    'charset' => 'utf8mb4',
];
