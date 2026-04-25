<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\CanBo;
use App\Models\ChuyenVien;
use App\Models\PasswordResetToken;
use App\Models\QuanLy;
use App\Models\SinhVien;
use App\Models\User;
use App\Rules\NoSqlInjection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class PasswordResetController extends Controller
{
    private const CAPTCHA_TTL_SECONDS = 300;

    private function jsonResponse(array $payload, int $status = 200): JsonResponse
    {
        return response()->json($payload, $status, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    public function captcha(): JsonResponse
    {
        $challengeId = (string) Str::uuid();
        $code = $this->generateCaptchaCode(6);
        $cacheKey = $this->captchaCacheKey($challengeId);

        Cache::put($cacheKey, strtolower($code), now()->addSeconds(self::CAPTCHA_TTL_SECONDS));

        return $this->jsonResponse([
            'challenge_id' => $challengeId,
            'captcha_image' => $this->buildCaptchaImageDataUri($code),
            'expires_in_seconds' => self::CAPTCHA_TTL_SECONDS,
            'captcha_code' => app()->environment('local') ? $code : null,
        ]);
    }

    public function forgot(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'identifier' => 'required|string',
                'captcha_id' => 'required|string',
                'captcha_code' => 'required|string|min:4|max:10',
            ]);

            $identifier = trim((string) $request->input('identifier'));
            $captchaId = (string) $request->input('captcha_id');
            $captchaCode = (string) $request->input('captcha_code');

            if (! $this->validateCaptcha($captchaId, $captchaCode)) {
                return $this->jsonResponse([
                    'message' => 'Mã bảo vệ không chính xác hoặc đã hết hạn',
                ], 422);
            }

            $user = $this->findUserByIdentifier($identifier);

            if (! $user) {
                return $this->jsonResponse([
                    'message' => 'Không tìm thấy tài khoản với thông tin này',
                ], 422);
            }

            $email = $user->profileEmail();

            if (! $email) {
                return $this->jsonResponse([
                    'message' => 'Tài khoản chưa có email để gửi liên kết đặt lại mật khẩu',
                ], 422);
            }

            $token = Str::random(64);
            $now = now();
            $expiresAt = $now->copy()->addMinutes(5);

            PasswordResetToken::query()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'email' => $email,
                    'token' => Hash::make($token),
                    'created_at' => $now,
                    'expires_at' => $expiresAt,
                ]
            );

            $resetUrl = \sprintf('%s/login/reset-password?token=%s&email=%s',
                env('FRONTEND_URL', 'http://localhost:5173'),
                urlencode($token),
                urlencode($email)
            );

            $displayName = $this->resolveDisplayName($user);
            $safeName = e($displayName);
            $safeCode = e((string) $user->username);

            $emailBody = '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;font-size:14px;color:#000;margin:0;padding:0;">'
                . 'Xin chào Ông/Bà <strong>' . $safeName . ' - mã số: ' . $safeCode . '</strong>,<br>'
                . 'Ông/Bà vừa yêu cầu khởi tạo lại mật khẩu cổng truy cập thông tin Trường Đại học Nha Trang. Xin vui lòng nhấn vào link sau đây để thực hiện: <a href="' . $resetUrl . '">' . $resetUrl . '</a><br>'
                . 'Chú ý rằng đường dẫn trên chỉ có hiệu lực trong vòng 5 phút.<br>'
                . 'Nếu Ông/Bà không thực hiện yêu cầu khởi tạo lại mật khẩu, xin vui lòng bỏ qua email này.<br>'
                . '<br>Trân trọng cảm ơn,<br>'
                . 'Trường Đại học Nha Trang.'
                . '</body></html>';

            try {
                // Send email after HTTP response to avoid blocking forgot-password latency.
                dispatch(function () use ($emailBody, $email): void {
                    Mail::html($emailBody, function ($message) use ($email) {
                        $message->to($email)
                            ->subject('Đặt lại mật khẩu - NTU Training Management System')
                            ->from(env('MAIL_FROM_ADDRESS', 'duytandao071205@gmail.com'));
                    });
                })->afterResponse();
            } catch (\Throwable $e) {
                Log::warning('Failed to queue password reset email dispatch: ' . $e->getMessage());
            }

            return $this->jsonResponse([
                'message' => 'Liên kết đặt lại mật khẩu đã được gửi tới email của bạn',
                'email' => $email,
                // Return token/link in local env to simplify API manual testing.
                'reset_token' => app()->environment('local') ? $token : null,
                'reset_url' => app()->environment('local') ? $resetUrl : null,
            ]);
        } catch (\Exception $e) {
            Log::error('Error in forgot password: ' . $e->getMessage() . '\n' . $e->getTraceAsString());
            return $this->jsonResponse([
                'message' => 'Lỗi xảy ra: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function checkEmail(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $email = trim((string) $request->input('email'));
        $username = $this->findUsernameByEmail($email);

        if (! $username) {
            return $this->jsonResponse([
                'message' => 'Không tìm thấy tài khoản với email này',
                'exists' => false,
            ], 422);
        }

        return $this->jsonResponse([
            'message' => 'Email hợp lệ',
            'exists' => true,
            'username' => $username,
        ]);
    }

    private function resolveDisplayName(User $user): string
    {
        $profile = $user->relationLoaded('profile')
            ? $user->profile
            : $user->profile()->first();

        if (! $profile) {
            return $user->username;
        }

        $name = trim((string) (
            $profile->getAttribute('ten_sinh_vien')
            ?? $profile->getAttribute('ten_giang_vien')
            ?? $profile->getAttribute('ten_chuyen_vien')
            ?? $profile->getAttribute('ten_nguoi_quan_ly')
            ?? ''
        ));

        return $name !== '' ? $name : $user->username;
    }

    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
            'email' => 'required|email',
        ]);

        $token = $request->input('token');
        $email = $request->input('email');

        $resetToken = $this->latestResetTokenByEmail($email);

        if (! $resetToken) {
            return $this->jsonResponse([
                'message' => 'Liên kết không hợp lệ',
            ], 422);
        }

        if (! Hash::check($token, $resetToken->token)) {
            return $this->jsonResponse([
                'message' => 'Liên kết không hợp lệ',
            ], 422);
        }

        if (! $resetToken->isValid()) {
            return $this->jsonResponse([
                'message' => 'Liên kết đã hết hạn, vui lòng yêu cầu liên kết mới',
            ], 422);
        }

        return $this->jsonResponse([
            'message' => 'Liên kết hợp lệ',
            'user_id' => $resetToken->user_id,
            'email' => $email,
        ]);
    }

    public function reset(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
            'email' => 'required|email',
            'password' => ['required', 'confirmed', new NoSqlInjection(), Password::defaults()],
        ]);

        $token = $request->input('token');
        $email = $request->input('email');
        $password = $request->input('password');

        $resetToken = $this->latestResetTokenByEmail($email, true);

        if (! $resetToken) {
            return $this->jsonResponse([
                'message' => 'Liên kết không hợp lệ',
            ], 422);
        }

        if (! Hash::check($token, $resetToken->token)) {
            return $this->jsonResponse([
                'message' => 'Liên kết không hợp lệ',
            ], 422);
        }

        if (! $resetToken->isValid()) {
            return $this->jsonResponse([
                'message' => 'Liên kết đã hết hạn',
            ], 422);
        }

        $user = $resetToken->user;

        if (! $user) {
            return $this->jsonResponse([
                'message' => 'Tài khoản không tồn tại',
            ], 422);
        }

        $user->update(['password' => Hash::make($password)]);

        $resetToken->delete();

        try {
            $changedAt = now()->format('d/m/Y H:i:s');
            dispatch(function () use ($email, $changedAt): void {
                Mail::raw(
                    "Mật khẩu tài khoản của bạn đã được thay đổi thành công vào {$changedAt}. Nếu bạn không thực hiện thao tác này, vui lòng liên hệ quản trị hệ thống ngay.",
                    function ($message) use ($email) {
                        $message->to($email)
                            ->subject('Xác nhận thay đổi mật khẩu - NTU Training Management System')
                            ->from(env('MAIL_FROM_ADDRESS', 'duytandao071205@gmail.com'));
                    }
                );
            })->afterResponse();
        } catch (\Throwable $e) {
            Log::warning('Failed to queue password changed confirmation email: ' . $e->getMessage());
        }

        return $this->jsonResponse([
            'message' => 'Mật khẩu đã được thay đổi thành công',
        ]);
    }

    private function latestResetTokenByEmail(string $email, bool $withUser = false): ?PasswordResetToken
    {
        $query = PasswordResetToken::query()
            ->select(['id', 'user_id', 'email', 'token', 'expires_at', 'created_at'])
            ->where('email', $email)
            ->latest('created_at');

        if ($withUser) {
            $query->with('user:id,password,username');
        }

        return $query->first();
    }

    private function findUserByIdentifier(string $identifier): ?User
    {
        $query = User::query()
            ->select(['id', 'username', 'role_id', 'profile_id', 'profile_type'])
            ->with('profile');

        if (filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
            $username = $this->findUsernameByEmail($identifier);

            if (! $username) {
                return null;
            }

            return $query->where('username', $username)->first();
        }

        return $query->where('username', $identifier)->first();
    }

    private function findUsernameByEmail(string $email): ?string
    {
        $normalizedEmail = mb_strtolower(trim($email));

        $username = SinhVien::query()
            ->whereRaw('LOWER(email) = ?', [$normalizedEmail])
            ->value('user_id');

        if ($username) {
            return (string) $username;
        }

        $username = CanBo::query()
            ->whereRaw('LOWER(email) = ?', [$normalizedEmail])
            ->value('user_id');

        if ($username) {
            return (string) $username;
        }

        $username = ChuyenVien::query()
            ->whereRaw('LOWER(email) = ?', [$normalizedEmail])
            ->value('user_id');

        if ($username) {
            return (string) $username;
        }

        $username = QuanLy::query()
            ->whereRaw('LOWER(email) = ?', [$normalizedEmail])
            ->value('user_id');

        return $username ? (string) $username : null;
    }

    private function captchaCacheKey(string $challengeId): string
    {
        return "forgot_password_captcha:{$challengeId}";
    }

    private function validateCaptcha(string $challengeId, string $inputCode): bool
    {
        $cachedCode = Cache::pull($this->captchaCacheKey($challengeId));

        if (! is_string($cachedCode)) {
            return false;
        }

        return hash_equals($cachedCode, strtolower(trim($inputCode)));
    }

    private function generateCaptchaCode(int $length): string
    {
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        $maxIndex = strlen($alphabet) - 1;
        $result = '';

        for ($i = 0; $i < $length; $i++) {
            $result .= $alphabet[random_int(0, $maxIndex)];
        }

        return $result;
    }

    private function buildCaptchaImageDataUri(string $code): string
    {
        $width = 220;
        $height = 70;
        $noise = '';

        for ($i = 0; $i < 18; $i++) {
            $x1 = random_int(0, $width);
            $y1 = random_int(0, $height);
            $x2 = random_int(0, $width);
            $y2 = random_int(0, $height);
            $noise .= "<line x1='{$x1}' y1='{$y1}' x2='{$x2}' y2='{$y2}' stroke='rgba(60,90,160,0.2)' stroke-width='1' />";
        }

        for ($i = 0; $i < 45; $i++) {
            $cx = random_int(0, $width);
            $cy = random_int(0, $height);
            $r = random_int(1, 2);
            $noise .= "<circle cx='{$cx}' cy='{$cy}' r='{$r}' fill='rgba(36,88,180,0.25)' />";
        }

        $letters = '';
        $chars = str_split($code);
        $baseX = 28;

        foreach ($chars as $index => $char) {
            $x = $baseX + ($index * 30);
            $y = random_int(40, 54);
            $rotate = random_int(-18, 18);
            $color = random_int(0, 1) === 1 ? '#2147a6' : '#3b2da8';
            $letters .= "<text x='{$x}' y='{$y}' font-size='34' font-family='Verdana, Arial, sans-serif' fill='{$color}' transform='rotate({$rotate} {$x} {$y})' font-weight='700'>{$char}</text>";
        }

        $svg = "<svg xmlns='http://www.w3.org/2000/svg' width='{$width}' height='{$height}' viewBox='0 0 {$width} {$height}'>"
            . "<rect width='100%' height='100%' fill='#f8fbff' />"
            . $noise
            . $letters
            . "</svg>";

        return 'data:image/svg+xml;base64,' . base64_encode($svg);
    }
}
