<?php

$databaseHost = getenv('TESTSITE_DB_HOST') ?: '127.0.0.1';
$databaseName = getenv('TESTSITE_DB_NAME') ?: 'testsite';
$databaseUser = getenv('TESTSITE_DB_USERNAME') ?: 'root';
$databasePassword = getenv('TESTSITE_DB_PASSWORD') ?: '';

return [
    'class' => 'yii\\db\\Connection',
    'dsn' => "mysql:host={$databaseHost};dbname={$databaseName}",
    'username' => $databaseUser,
    'password' => $databasePassword,
    'charset' => 'utf8mb4',
];
