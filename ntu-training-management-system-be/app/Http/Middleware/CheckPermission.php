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
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $hasPermission = $user->role()
            ->first()
            ?->permissions()
            ->where('code', $permission)
            ->exists();

        if (! $hasPermission) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return $next($request);
    }
}
