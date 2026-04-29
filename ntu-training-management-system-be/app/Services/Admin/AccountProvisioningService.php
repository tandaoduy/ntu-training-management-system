<?php

namespace App\Services\Admin;

use App\Models\CanBo;
use App\Models\ChuyenVien;
use App\Models\Lop;
use App\Models\QuanLy;
use App\Models\Role;
use App\Models\SinhVien;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class AccountProvisioningService
{
    /**
     * Create a student account
     */
    public function createStudentAccount(array $payload): User
    {
        return DB::transaction(function () use ($payload) {
            $role = Role::where('code', 'student')->firstOrFail();

            $user = User::create([
                'username' => $payload['username'],
                'password' => $payload['password'] ?? '123456789',
                'role_id' => $role->id,
                'status' => $payload['status'] ?? true,
            ]);

            $sinhVien = SinhVien::create([
                'user_id' => $user->username,
                'ten_sinh_vien' => $payload['ten_sinh_vien'] ?? $payload['name'] ?? '',
                'email' => $payload['email'] ?? null,
                'so_dien_thoai' => $payload['so_dien_thoai'] ?? $payload['phone'] ?? null,
                'ngay_sinh' => $payload['ngay_sinh'] ?? null,
                'gioi_tinh' => $payload['gioi_tinh'] ?? null,
                'noi_sinh' => $payload['noi_sinh'] ?? null,
                'ma_lop' => $payload['ma_lop'] ?? null,
                'lop_id' => $payload['lop_id'] ?? null,
                'don_vi_id' => $payload['don_vi_id'] ?? null,
                'nganh_dao_tao_id' => $payload['nganh_dao_tao_id'] ?? null,
                'ten_don_vi' => $payload['ten_don_vi'] ?? null,
                'ten_nganh_hoc' => $payload['ten_nganh_hoc'] ?? null,
                'he_dao_tao' => $payload['he_dao_tao'] ?? 'Đại học Chính quy',
                'so_cccd' => $payload['so_cccd'] ?? null,
                'ngay_cap_cccd' => $payload['ngay_cap_cccd'] ?? null,
                'noi_cap_cccd' => $payload['noi_cap_cccd'] ?? null,
                'ho_khau_tinh_thanh_pho' => $payload['ho_khau_tinh_thanh_pho'] ?? null,
                'ho_khau_quan_huyen' => $payload['ho_khau_quan_huyen'] ?? null,
                'que_quan_tinh_thanh_pho' => $payload['que_quan_tinh_thanh_pho'] ?? null,
                'que_quan_quan_huyen' => $payload['que_quan_quan_huyen'] ?? null,
                'que_quan' => $payload['que_quan'] ?? null,
                'dan_toc' => $payload['dan_toc'] ?? null,
                'ton_giao' => $payload['ton_giao'] ?? null,
                'dia_chi_lien_lac' => $payload['dia_chi_lien_lac'] ?? null,
            ]);

            $this->incrementLopSize($sinhVien->lop_id);

            $user->forceFill([
                'profile_id' => $sinhVien->id,
                'profile_type' => SinhVien::class,
            ])->save();

            return $user->load(['role', 'profile']);
        });
    }

    /**
     * Create a lecturer account
     */
    public function createLecturerAccount(array $payload): User
    {
        return DB::transaction(function () use ($payload) {
            $role = Role::where('code', 'lecturer')->firstOrFail();

            $user = User::create([
                'username' => $payload['username'],
                'password' => $payload['password'] ?? '123456789',
                'role_id' => $role->id,
                'status' => $payload['status'] ?? true,
            ]);

            $canBo = CanBo::create([
                'user_id' => $user->username,
                'ten_giang_vien' => $payload['ten_giang_vien'] ?? $payload['name'] ?? '',
                'email' => $payload['email'] ?? null,
                'so_dien_thoai' => $payload['so_dien_thoai'] ?? $payload['phone'] ?? null,
                'ngay_sinh' => $payload['ngay_sinh'] ?? null,
                'gioi_tinh' => $payload['gioi_tinh'] ?? null,
                'que_quan' => $payload['que_quan'] ?? null,
                'chuc_vu' => $payload['chuc_vu'] ?? null,
                'chuc_danh' => $payload['chuc_danh'] ?? null,
                'dia_chi' => $payload['dia_chi'] ?? null,
            ]);

            $user->forceFill([
                'profile_id' => $canBo->id,
                'profile_type' => CanBo::class,
            ])->save();

            return $user->load(['role', 'profile']);
        });
    }

    /**
     * Create a manager account
     */
    public function createManagerAccount(array $payload): User
    {
        return DB::transaction(function () use ($payload) {
            $role = Role::where('code', 'manager')->firstOrFail();

            $user = User::create([
                'username' => $payload['username'],
                'password' => $payload['password'] ?? '123456789',
                'role_id' => $role->id,
                'status' => $payload['status'] ?? true,
            ]);

            $quanLy = QuanLy::create([
                'user_id' => $user->username,
                'ten_nguoi_quan_ly' => $payload['ten_nguoi_quan_ly'] ?? $payload['name'] ?? '',
                'email' => $payload['email'] ?? null,
                'so_dien_thoai' => $payload['so_dien_thoai'] ?? $payload['phone'] ?? null,
                'ngay_sinh' => $payload['ngay_sinh'] ?? null,
                'gioi_tinh' => $payload['gioi_tinh'] ?? null,
                'que_quan' => $payload['que_quan'] ?? null,
                'chuc_vu' => $payload['chuc_vu'] ?? null,
            ]);

            $user->forceFill([
                'profile_id' => $quanLy->id,
                'profile_type' => QuanLy::class,
            ])->save();

            return $user->load(['role', 'profile']);
        });
    }

    /**
     * Create a training officer account
     */
    public function createTrainingOfficerAccount(array $payload): User
    {
        return DB::transaction(function () use ($payload) {
            $role = Role::where('code', 'training_officer')->firstOrFail();

            $user = User::create([
                'username' => $payload['username'],
                'password' => $payload['password'] ?? '123456789',
                'role_id' => $role->id,
                'status' => $payload['status'] ?? true,
            ]);

            $chuyenVien = ChuyenVien::create([
                'user_id' => $user->username,
                'ten_chuyen_vien' => $payload['ten_chuyen_vien'] ?? $payload['name'] ?? '',
                'email' => $payload['email'] ?? null,
                'so_dien_thoai' => $payload['so_dien_thoai'] ?? $payload['phone'] ?? null,
                'ngay_sinh' => $payload['ngay_sinh'] ?? null,
                'gioi_tinh' => $payload['gioi_tinh'] ?? null,
                'que_quan' => $payload['que_quan'] ?? null,
                'chuc_vu' => $payload['chuc_vu'] ?? null,
            ]);

            $user->forceFill([
                'profile_id' => $chuyenVien->id,
                'profile_type' => ChuyenVien::class,
            ])->save();

            return $user->load(['role', 'profile']);
        });
    }

    /**
     * Update an account
     */
    public function updateAccount(User $user, array $payload): User
    {
        return DB::transaction(function () use ($user, $payload) {
            $user->loadMissing(['role', 'profile']);
            $oldLopId = $user->role?->code === 'student'
                ? $user->profile?->getAttribute('lop_id')
                : null;

            if (isset($payload['password'])) {
                $user->update(['password' => $payload['password']]);
            }

            if (isset($payload['status'])) {
                $user->update(['status' => $payload['status']]);
            }

            if (isset($payload['profile'])) {
                $user->profile()?->update($payload['profile']);
            }

            $user->refresh()->load(['role', 'profile']);
            $newLopId = $user->role?->code === 'student'
                ? $user->profile?->getAttribute('lop_id')
                : null;

            if ((string) $oldLopId !== (string) $newLopId) {
                $this->decrementLopSize($oldLopId);
                $this->incrementLopSize($newLopId);
            }

            return $user;
        });
    }

    /**
     * Reset password for an account
     */
    public function resetPassword(User $user, ?string $password = null): User
    {
        $password = $password ?? '123456789';
        $user->update(['password' => $password]);

        return $user->refresh()->load(['role', 'profile']);
    }

    /**
     * Set account status (lock/unlock)
     */
    public function setAccountStatus(User $user, bool $status): User
    {
        $user->update(['status' => $status]);

        return $user->refresh()->load(['role', 'profile']);
    }

    private function incrementLopSize(null|int|string $lopId): void
    {
        if (! $lopId) {
            return;
        }

        Lop::query()
            ->whereKey($lopId)
            ->increment('si_so');
    }

    private function decrementLopSize(null|int|string $lopId): void
    {
        if (! $lopId) {
            return;
        }

        Lop::query()
            ->whereKey($lopId)
            ->where('si_so', '>', 0)
            ->decrement('si_so');
    }
}
