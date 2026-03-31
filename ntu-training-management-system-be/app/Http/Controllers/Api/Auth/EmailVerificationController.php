<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\EmailVerification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class EmailVerificationController extends Controller
{
    public function status(Request $request): JsonResponse
    {
        $user = $request->user()?->loadMissing('profile', 'emailVerification');

        return response()->json([
            'email' => $user?->profileEmail(),
            'email_verified' => $user?->isEmailVerified() ?? false,
            'verified_at' => $user?->emailVerification?->verified_at,
        ]);
    }

    public function send(Request $request): JsonResponse
    {
        $user = $request->user()?->loadMissing('profile', 'emailVerification');

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $email = $user->profileEmail();

        if (! $email) {
            return response()->json([
                'message' => 'Tài khoản chưa có email hồ sơ để xác thực',
            ], 422);
        }

        $verification = EmailVerification::query()->firstOrNew(['user_id' => $user->id]);

        if ($verification->email_snapshot !== null && $verification->email_snapshot !== $email) {
            $verification->verified_at = null;
        }

        $verification->email_snapshot = $email;
        $verification->last_verification_sent_at = now();
        $verification->save();

        $expiresAt = now()->addMinutes((int) env('EMAIL_VERIFICATION_EXPIRE_MINUTES', 15));
        $signedPath = URL::temporarySignedRoute(
            'auth.verification.verify',
            $expiresAt,
            [
                'user' => $user->id,
                'hash' => sha1(Str::lower($email)),
            ],
            false,
        );
        $signedUrl = url($signedPath);

        Mail::raw(
            "Chao ban,\n\nVui long bam vao lien ket duoi day de xac thuc email:\n{$signedUrl}\n\nLien ket co hieu luc den {$expiresAt->toDateTimeString()}.\n",
            function ($message) use ($email): void {
                $message->to($email)->subject('Xac thuc email tai khoan');
            }
        );

        return response()->json([
            'message' => 'Da gui email xac thuc',
            'expires_at' => $expiresAt,
            'verification_url' => $signedUrl,
            'verification_path' => $signedPath,
        ]);
    }

    public function verify(Request $request, int $user, string $hash): JsonResponse
    {
        $account = User::query()->with(['profile', 'emailVerification'])->findOrFail($user);
        $email = $account->profileEmail();

        if (! $email) {
            return response()->json([
                'message' => 'Khong tim thay email ho so de xac thuc',
            ], 422);
        }

        if (! hash_equals(sha1(Str::lower($email)), $hash)) {
            return response()->json([
                'message' => 'Lien ket xac thuc khong hop le',
            ], 403);
        }

        $verification = EmailVerification::query()->firstOrCreate(
            ['user_id' => $account->id],
            ['email_snapshot' => $email],
        );

        if ($verification->email_snapshot !== $email) {
            return response()->json([
                'message' => 'Email da thay doi. Vui long gui lai lien ket xac thuc moi',
            ], 409);
        }

        $verification->forceFill([
            'verified_at' => now(),
            'email_snapshot' => $email,
        ])->save();

        return response()->json([
            'message' => 'Xac thuc email thanh cong',
            'email_verified' => true,
        ]);
    }
}
