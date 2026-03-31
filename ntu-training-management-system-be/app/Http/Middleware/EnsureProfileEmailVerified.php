<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureProfileEmailVerified
{
    public function handle(Request $request, Closure $next): Response|JsonResponse
    {
        $user = $request->user()?->loadMissing(['profile', 'emailVerification']);

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $email = $user->profileEmail();

        if (! $email) {
            return response()->json(['message' => 'Tài khoản chưa có email hồ sơ'], 422);
        }

        $verification = $user->emailVerification;

        if (! $verification?->verified_at || $verification->email_snapshot !== $email) {
            return response()->json([
                'message' => 'Email chưa được xác thực',
                'email_verified' => false,
            ], 403);
        }

        return $next($request);
    }
}
