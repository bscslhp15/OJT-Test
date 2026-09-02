<?php
$params = require __DIR__ . '/params.php';
$db = require __DIR__ . '/db.php';

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
        'errorHandler' => [
            'errorAction' => 'site/error',
        ],
        'log' => [
            'traceLevel' => YII_DEBUG ? 3 : 0,
            'targets' => [
                [
                    'class' => 'yii\log\FileTarget',
                    'levels' => ['error', 'warning'],
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
                [
                    'class' => 'yii\rest\UrlRule',
                    'controller' => ['auth', 'post', 'comment'],
                    'extraPatterns' => [
                        'POST register' => 'register',
                        'POST login' => 'login',
                        'POST update-profile' => 'update-profile',
                        'POST resend-confirmation' => 'resend-confirmation',
                        'POST forgot-password' => 'forgot-password',
                        'POST request-password-change' => 'request-password-change',
                        'POST reset-password' => 'reset-password',
                    ],
                ],
            ],
        ],
    ],
    'as corsFilter' => [
        'class' => \yii\filters\Cors::class,
        'cors' => [
            'Origin' => ['http://localhost:3000'],
            'Access-Control-Request-Method' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            'Access-Control-Allow-Credentials' => true,
            'Access-Control-Allow-Headers' => ['*'],
            'Access-Control-Expose-Headers' => ['*'],
        ],
    ],
    'params' => $params,
];

return $config;
