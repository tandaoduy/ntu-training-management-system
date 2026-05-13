<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureStudentRole
{
    public function handle(Request $request, Closure $next): Response|JsonResponse
    {
        $user = $request->user()?->loadMissing('role');

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($user->role?->code !== 'student') {
            return response()->json([
                'message' => 'Tài khoản hiện tại không có quyền truy cập API sinh viên.',
                'required_role' => 'student',
                'current_role' => $user->role?->code,
            ], 403, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }

        return $next($request);
    }
}
