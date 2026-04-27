<?php

namespace App\Services\Admin;

use App\Models\CanBo;
use App\Models\ChuyenVien;
use App\Models\Lop;
use App\Models\QuanLy;
use App\Models\Role;
use App\Models\SinhVien;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AccountProvisioningService
{
    private const DEFAULT_PASSWORD = '123456789';

    public function createStudentAccount(array $payload): User
    {
        $lop = $this->resolveLop($payload['lop_id'] ?? null);

        $user = $this->createAccount('student', $payload, SinhVien::class, [
            'ten_sinh_vien' => $payload['ten_sinh_vien'] ?? $payload['name'] ?? null,
            'ngay_sinh' => $payload['ngay_sinh'] ?? null,
            'noi_sinh' => $payload['noi_sinh'] ?? null,
            'gioi_tinh' => $payload['gioi_tinh'] ?? null,
            'email' => $payload['email'] ?? null,
            'so_dien_thoai' => $payload['so_dien_thoai'] ?? $payload['phone'] ?? null,
            'ma_lop' => $lop?->ma_khoi ?? $payload['ma_lop'] ?? null,
            'lop_id' => $lop?->id,
            'nganh_dao_tao_id' => $payload['nganh_dao_tao_id'] ?? null,
            'ten_nganh_hoc' => $payload['ten_nganh_hoc'] ?? null,
            'don_vi_id' => $lop?->don_vi_id ?? $payload['don_vi_id'] ?? null,
            'ten_don_vi' => $lop?->ten_don_vi ?? $lop?->donVi?->ten_don_vi ?? $payload['ten_don_vi'] ?? null,
            'he_dao_tao' => $payload['he_dao_tao'] ?? null,
            'so_cccd' => $payload['so_cccd'] ?? null,
            'ngay_cap_cccd' => $payload['ngay_cap_cccd'] ?? null,
            'noi_cap_cccd' => $payload['noi_cap_cccd'] ?? null,
            'ho_khau_tinh_thanh_pho' => $payload['ho_khau_tinh_thanh_pho'] ?? null,
            'ho_khau_quan_huyen' => $payload['ho_khau_quan_huyen'] ?? null,
            'que_quan' => $payload['que_quan'] ?? null,
            'que_quan_tinh_thanh_pho' => $payload['que_quan_tinh_thanh_pho'] ?? null,
            'que_quan_quan_huyen' => $payload['que_quan_quan_huyen'] ?? null,
            'dan_toc' => $payload['dan_toc'] ?? null,
            'ton_giao' => $payload['ton_giao'] ?? null,
            'dia_chi_lien_lac' => $payload['dia_chi_lien_lac'] ?? null,
        ]);

        if ($lop) {
            $lop->increment('si_so');
        }

        return $user;
    }

    public function createLecturerAccount(array $payload): User
    {
        return $this->createAccount('lecturer', $payload, CanBo::class, [
            'ten_giang_vien' => $payload['ten_giang_vien'] ?? $payload['name'] ?? null,
            'ngay_sinh' => $payload['ngay_sinh'] ?? null,
            'que_quan' => $payload['que_quan'] ?? null,
            'don_vi_id' => $payload['don_vi_id'] ?? null,
            'dia_chi' => $payload['dia_chi'] ?? null,
            'so_dien_thoai' => $payload['so_dien_thoai'] ?? $payload['phone'] ?? null,
            'chuc_vu' => $payload['chuc_vu'] ?? null,
            'chuc_danh' => $payload['chuc_danh'] ?? null,
            'email' => $payload['email'] ?? null,
            'gioi_tinh' => $payload['gioi_tinh'] ?? null,
            'ton_giao' => $payload['ton_giao'] ?? null,
            'dan_toc' => $payload['dan_toc'] ?? null,
        ]);
    }

    public function createManagerAccount(array $payload): User
    {
        return $this->createAccount('manager', $payload, QuanLy::class, [
            'ten_nguoi_quan_ly' => $payload['ten_nguoi_quan_ly'] ?? $payload['name'] ?? null,
            'email' => $payload['email'] ?? null,
            'chuc_vu' => $payload['chuc_vu'] ?? null,
            'que_quan' => $payload['que_quan'] ?? null,
            'ngay_sinh' => $payload['ngay_sinh'] ?? null,
            'so_dien_thoai' => $payload['so_dien_thoai'] ?? $payload['phone'] ?? null,
            'ton_giao' => $payload['ton_giao'] ?? null,
            'dan_toc' => $payload['dan_toc'] ?? null,
            'don_vi_id' => $payload['don_vi_id'] ?? null,
        ]);
    }

    public function createTrainingOfficerAccount(array $payload): User
    {
        return $this->createAccount('training_officer', $payload, ChuyenVien::class, [
            'ten_chuyen_vien' => $payload['ten_chuyen_vien'] ?? $payload['name'] ?? null,
            'email' => $payload['email'] ?? null,
            'chuc_vu' => $payload['chuc_vu'] ?? null,
            'que_quan' => $payload['que_quan'] ?? null,
            'ngay_sinh' => $payload['ngay_sinh'] ?? null,
            'so_dien_thoai' => $payload['so_dien_thoai'] ?? $payload['phone'] ?? null,
            'gioi_tinh' => $payload['gioi_tinh'] ?? null,
            'don_vi_id' => $payload['don_vi_id'] ?? null,
            'ton_giao' => $payload['ton_giao'] ?? null,
            'dan_toc' => $payload['dan_toc'] ?? null,
        ]);
    }

    public function updateAccount(User $user, array $payload): User
    {
        return DB::transaction(function () use ($user, $payload): User {
            if (array_key_exists('status', $payload)) {
                $user->status = (bool) $payload['status'];
            }

            if (! empty($payload['password'])) {
                $user->password = Hash::make((string) $payload['password']);
            }

            $user->save();
            $user->loadMissing(['role', 'profile']);

            $profile = $user->profile;

            if ($profile && ! empty($payload['profile']) && is_array($payload['profile'])) {
                $this->assertEmailIsAvailable($payload['profile']['email'] ?? null, $profile);
                $profile->fill(array_filter(
                    $payload['profile'],
                    fn ($value): bool => $value !== null,
                ));
                $profile->save();
            }

            return $user->fresh(['role', 'profile']);
        });
    }

    public function resetPassword(User $user, ?string $password = null): User
    {
        $user->forceFill([
            'password' => Hash::make($password ?: self::DEFAULT_PASSWORD),
        ])->save();

        return $user->fresh(['role', 'profile']);
    }

    public function setAccountStatus(User $user, bool $status): User
    {
        $user->forceFill(['status' => $status])->save();

        return $user->fresh(['role', 'profile']);
    }

    private function createAccount(string $roleCode, array $payload, string $profileClass, array $profileAttributes): User
    {
        $username = trim((string) ($payload['username'] ?? ''));

        if ($username === '') {
            throw ValidationException::withMessages([
                'username' => ['Tên đăng nhập là bắt buộc.'],
            ]);
        }

        $this->assertUsernameIsAvailable($username);
        $this->assertEmailIsAvailable($profileAttributes['email'] ?? null);

        return DB::transaction(function () use ($roleCode, $payload, $profileClass, $profileAttributes, $username): User {
            $role = Role::query()->where('code', $roleCode)->firstOrFail();
            $password = (string) ($payload['password'] ?? self::DEFAULT_PASSWORD);

            $user = User::query()->create([
                'username' => $username,
                'password' => Hash::make($password),
                'role_id' => $role->id,
                'status' => (bool) ($payload['status'] ?? true),
            ]);

            $profile = $profileClass::query()->create(array_filter([
                ...$profileAttributes,
                'user_id' => $username,
            ], fn ($value): bool => $value !== null));

            $user->forceFill([
                'profile_id' => $profile->id,
                'profile_type' => $profile::class,
            ])->save();

            return $user->fresh(['role', 'profile']);
        });
    }

    private function assertUsernameIsAvailable(string $username): void
    {
        if (User::query()->where('username', $username)->exists()) {
            throw ValidationException::withMessages([
                'username' => ['Tên đăng nhập đã tồn tại.'],
            ]);
        }
    }

    private function assertEmailIsAvailable(?string $email, ?Model $ignoreProfile = null): void
    {
        $email = trim((string) $email);

        if ($email === '') {
            return;
        }

        $profileClasses = [SinhVien::class, CanBo::class, ChuyenVien::class, QuanLy::class];

        foreach ($profileClasses as $profileClass) {
            $query = $profileClass::query()->whereRaw('LOWER(email) = ?', [mb_strtolower($email)]);

            if ($ignoreProfile && $ignoreProfile instanceof $profileClass) {
                $query->whereKeyNot($ignoreProfile->getKey());
            }

            if ($query->exists()) {
                throw ValidationException::withMessages([
                    'email' => ['Email đã tồn tại trong hệ thống.'],
                ]);
            }
        }
    }

    private function resolveLop(mixed $lopId): ?Lop
    {
        if (! $lopId) {
            return null;
        }

        return Lop::query()->with('donVi')->findOrFail($lopId);
    }
}
