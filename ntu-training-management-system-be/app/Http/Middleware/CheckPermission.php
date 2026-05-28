<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $required = collect($permissions)
            ->flatMap(fn (string $permission) => explode('|', $permission))
            ->map(fn (string $permission) => trim($permission))
            ->filter()
            ->values();

        $hasPermission = $required->contains(fn (string $permission) => $user->hasPermission($permission));

        if (! $hasPermission) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return $next($request);
    }
}
