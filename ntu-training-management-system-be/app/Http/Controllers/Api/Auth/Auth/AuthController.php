<?php

namespace App\Http\Controllers\Api\Auth\Auth;

use App\Http\Controllers\Controller;
use App\Models\CanBo;
use App\Models\DonVi;
use App\Models\Lop;
use App\Models\SinhVien;
use App\Models\User;
use App\Rules\NoSqlInjection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    // API: Đăng nhập
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()
            ->with(['role:id,code', 'profile', 'emailVerification'])
            ->select(['id', 'username', 'password', 'status', 'last_login_at', 'role_id', 'profile_id', 'profile_type'])
            ->where('username', $credentials['username'])
            ->first();

        // Sai tài khoản hoặc sai mật khẩu
        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            return response()->json(['message' => 'Invalid username or password'], 401);
        }

        // Tài khoản bị khóa
        if (! $user->status) {
            return response()->json(['message' => 'Account is locked'], 403);
        }

        $user->forceFill(['last_login_at' => now()])->save();

        $token = $user->createToken('auth_token')->plainTextToken;
        $unit = $this->profileUnit($user);

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $this->userPayload($user, $unit),
        ]);
    }

    // API: Đăng xuất
    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        if (! $request->user()) {
            $token = $request->bearerToken();
            if ($token) {
                PersonalAccessToken::findToken($token)?->delete();
            }
        }

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    // API: Gia han phien dang nhap hien tai bang cach cap token moi.
    public function extendSession(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user || ! $user->status) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $currentToken = $user->currentAccessToken();
        $token = $user->createToken('auth_token')->plainTextToken;
        $currentToken?->delete();

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'expires_in' => ((int) config('sanctum.expiration', 15)) * 60,
            'message' => 'Session extended successfully',
        ]);
    }

    // API: Lấy thông tin người dùng hiện tại
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user || ! $user->status) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $user->loadMissing(['role', 'profile', 'emailVerification']);
        $unit = $this->profileUnit($user);

        return response()->json($this->userPayload($user, $unit));
    }

    private function userPayload(User $user, ?DonVi $unit = null): array
    {
        return [
            'id' => $user->id,
            'username' => $user->username,
            'name' => $user->profileName(),
            'role' => $user->role?->code,
            'email' => $user->profileEmail(),
            'education_system' => $user->role?->code === 'student'
                ? $user->profile?->getAttribute('he_dao_tao')
                : null,
            'don_vi_id' => $unit?->id,
            'ten_don_vi' => $unit?->ten_don_vi,
            'email_verified' => $user->isEmailVerified(),
            'permissions' => $user->permissionCodes()->values()->all(),
            'advisor' => $this->studentAdvisorPayload($user),
        ];
    }

    private function studentAdvisorPayload(User $user): ?array
    {
        if ($user->role?->code !== 'student') {
            return null;
        }

        $profile = $user->relationLoaded('profile')
            ? $user->profile
            : $user->profile()->first();

        if (! $profile instanceof SinhVien) {
            return null;
        }

        $class = $profile->lop_id
            ? Lop::query()->find($profile->lop_id)
            : Lop::query()->where('lop_hoc_phan', $profile->ma_lop)->first();

        $advisorName = trim((string) ($class?->ten_giang_vien ?? ''));
        if ($advisorName === '') {
            return [
                'has_advisor' => false,
                'message' => 'Không có cố vấn học tập',
            ];
        }

        $advisor = CanBo::query()
            ->whereRaw('LOWER(ten_giang_vien) = ?', [mb_strtolower($advisorName, 'UTF-8')])
            ->first();

        return [
            'has_advisor' => true,
            'code' => $advisor?->user_id,
            'name' => $advisor?->ten_giang_vien ?? $advisorName,
            'phone' => $advisor?->so_dien_thoai,
            'email' => $advisor?->email,
        ];
    }

    private function profileUnit(User $user): ?DonVi
    {
        $profile = $user->relationLoaded('profile')
            ? $user->profile
            : $user->profile()->first();

        $unitId = $profile?->getAttribute('don_vi_id');

        return $unitId ? DonVi::query()->find($unitId) : null;
    }

    // API: Đổi mật khẩu
    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'old_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:6', new NoSqlInjection()],
            'confirm_password' => ['required', 'same:new_password'],
        ]);

        $user = $request->user();

        // Mật khẩu cũ không đúng
        if (! $user || ! Hash::check($validated['old_password'], $user->password)) {
            return response()->json(['message' => 'Old password is incorrect'], 422);
        }

        $user->password = Hash::make($validated['new_password']);
        $user->save();

        return response()->json([
            'message' => 'Password updated successfully',
        ]);
    }
}
