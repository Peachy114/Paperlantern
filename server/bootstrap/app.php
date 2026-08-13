<?php

use Illuminate\Foundation\Application;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withCommands([
        \App\Console\Commands\SendSampleMail::class,
    ])
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role'   => \App\Http\Middleware\RoleMiddleware::class,
            'banned' => \App\Http\Middleware\BannedMiddleware::class,
            'creator.feature' => \App\Http\Middleware\CreatorFeatureMiddleware::class,
        ]);

        $middleware->appendToGroup('api', \App\Http\Middleware\BannedMiddleware::class);

        $middleware->validateCsrfTokens(except: [
            'api/webhooks/paymongo',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (ValidationException $exception, Request $request) {
            if (! $request->is('api/*') && ! $request->expectsJson()) return null;

            $errors = $exception->errors();
            $failed = $exception->validator->failed();
            foreach ($errors as $field => &$messages) {
                $file = $request->file($field);
                $maxKb = $failed[$field]['Max'][0] ?? null;
                if ($file && $maxKb) {
                    $maxMb = rtrim(rtrim(number_format(((int) $maxKb) / 1024, 2), '0'), '.');
                    $messages = [str_replace('_', ' ', ucfirst($field))." must be {$maxMb} MB or smaller."];
                } elseif ($file && (isset($failed[$field]['Mimes']) || isset($failed[$field]['Mimetypes']) || isset($failed[$field]['Image']))) {
                    $messages = [str_replace('_', ' ', ucfirst($field)).' has an unsupported or invalid file format.'];
                }
            }
            unset($messages);

            return response()->json([
                'message' => 'Please correct the highlighted fields and try again.',
                'errors' => $errors,
            ], 422);
        });

        $exceptions->render(function (AuthenticationException $exception, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'message' => 'Unauthenticated. Please log in and try again.',
                ], 401);
            }

            return null;
        });
    })->create();
