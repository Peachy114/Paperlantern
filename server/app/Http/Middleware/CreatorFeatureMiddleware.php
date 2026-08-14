<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CreatorFeatureMiddleware
{
    public function handle(Request $request, Closure $next, string ...$features): Response
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated. Please log in and try again.'], 401);
        }

        if (! collect($features)->contains(fn (string $feature) => $user->hasCreatorFeature($feature))) {
            return response()->json([
                'message' => 'This creator feature is disabled. Enable it in Profile Settings to continue.',
                'errors' => ['creator_features' => ['Enable the required creator feature in Profile Settings.']],
            ], 403);
        }

        return $next($request);
    }
}
