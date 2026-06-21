<?php

return [

    'paths' => [
        'api/*',
        'login',
        'logout',
        'register',
        'wallet/*',
        'sanctum/csrf-cookie',
    ],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:5173',
        'https://laterncomix.com',
        'https://www.laterncomix.com',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 86400,

    'supports_credentials' => true,

];