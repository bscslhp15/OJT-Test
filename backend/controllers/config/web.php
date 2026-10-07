<?php
$params = require __DIR__ . '/params.php';
$db = require __DIR__ . '/db.php';
$allowedOrigins = ['http://localhost:3000', 'http://localhost'];
$frontendOrigin = getenv('TESTSITE_FRONTEND_ORIGIN');
if ($frontendOrigin) {
    $allowedOrigins[] = $frontendOrigin;
}

$config = [
    'id' => 'testsite-backend',
    'basePath' => dirname(dirname(__DIR__)),
    'bootstrap' => ['log'],
    'components' => [
        'request' => [
            'cookieValidationKey' => 'testsite-secret-key',
            'parsers' => [
                'application/json' => 'yii\web\JsonParser',
            ],
            'enableCsrfValidation' => false,
        ],
        'response' => [
            'format' => yii\web\Response::FORMAT_JSON,
            'charset' => 'UTF-8',
        ],
        'cache' => [
            'class' => 'yii\caching\FileCache',
        ],
        'user' => [
            'identityClass' => 'app\models\User',
            'enableAutoLogin' => false,
            'enableSession' => false,
            'loginUrl' => null,
        ],
        'view' => [
            'class' => yii\web\View::class,
        ],
        'log' => [
            'traceLevel' => YII_DEBUG ? 3 : 0,
            'targets' => [
                [
                    'class' => 'yii\log\FileTarget',
                    'logFile' => 'php://stderr',
                    'levels' => ['error', 'warning'],
                    'logVars' => [],
                ],
            ],
        ],
        'db' => $db,
        'urlManager' => [
            'enablePrettyUrl' => true,
            'showScriptName' => false,
            'enableStrictParsing' => false,
            'rules' => [
                'confirm/<token>' => 'auth/confirm',
                'GET auth/profile/<identifier:[A-Za-z0-9_.-]+>' => 'auth/profile',
                [
                    'class' => 'yii\rest\UrlRule',
                    'controller' => ['auth', 'post', 'comment', 'contact'],
                    'pluralize' => false,
                    'extraPatterns' => [
                        'GET users' => 'users',
                        'POST users/create' => 'create-admin-user',
                        'POST users/bulk-action' => 'users-bulk-action',
                        'POST moderate' => 'moderate',
                        'POST register' => 'register',
                        'POST login' => 'login',
                        'POST update-profile' => 'update-profile',
                        'POST resend-confirmation' => 'resend-confirmation',
                        'POST forgot-password' => 'forgot-password',
                        'POST request-password-change' => 'request-password-change',
                        'POST reset-password' => 'reset-password',
                        'POST send-message' => 'send-message',
                    ],
                ],
            ],
        ],
    ],
    'as corsFilter' => [
        'class' => \yii\filters\Cors::class,
        'cors' => [
            'Origin' => $allowedOrigins,
            'Access-Control-Request-Method' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            'Access-Control-Allow-Credentials' => true,
            'Access-Control-Request-Headers' => ['*'],
            'Access-Control-Expose-Headers' => ['*'],
        ],
    ],
    'params' => $params,
];

return $config;
