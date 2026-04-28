<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Rules\NoSqlInjection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

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

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'display_name' => $user->profileName(),
                'role' => $user->role?->code,
                'email' => $user->profileEmail(),
                'email_verified' => $user->isEmailVerified(),
            ],
        ]);
    }

    // API: Đăng xuất
    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    // API: Lấy thông tin người dùng hiện tại
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()?->loadMissing(['role', 'profile', 'emailVerification']);

        return response()->json([
            'id' => $user?->id,
            'username' => $user?->username,
            'display_name' => $user?->profileName(),
            'role' => $user?->role?->code,
            'email' => $user?->profileEmail(),
            'email_verified' => $user?->isEmailVerified() ?? false,
        ]);
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
