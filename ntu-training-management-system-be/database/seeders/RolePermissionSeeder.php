<?php

namespace Database\Seeders;

use App\Models\CanBo;
use App\Models\ChuyenVien;
use App\Models\Permission;
use App\Models\QuanLy;
use App\Models\Role;
use App\Models\SinhVien;
use App\Models\User;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    private const DEFAULT_PASSWORD = '123456789';

    /**
    * Seed roles, permissions, and demo accounts.
     */
    public function run(): void
    {
        $roles = [
            ['code' => 'student', 'name' => 'Sinh vien'],
            ['code' => 'lecturer', 'name' => 'Giang vien'],
            ['code' => 'training_officer', 'name' => 'Chuyen vien phong Dao tao'],
            ['code' => 'manager', 'name' => 'Truong/Pho khoa'],
            ['code' => 'admin', 'name' => 'Quan tri he thong'],
        ];

        foreach ($roles as $role) {
            Role::query()->updateOrCreate(
                ['code' => $role['code']],
                [
                    'name' => $role['name'],
                    'description' => null,
                ],
            );
        }

        $permissions = [
            ['code' => 'student.dashboard.view', 'name' => 'Xem dashboard', 'module' => 'student'],
            ['code' => 'student.profile.view', 'name' => 'Xem thong tin ca nhan', 'module' => 'student'],
            ['code' => 'student.profile.edit', 'name' => 'Sua thong tin ca nhan', 'module' => 'student'],
            ['code' => 'student.schedule.view', 'name' => 'Xem thoi khoa bieu', 'module' => 'student'],
            ['code' => 'student.grade.view', 'name' => 'Xem diem', 'module' => 'student'],
            ['code' => 'student.enrollment.view', 'name' => 'Xem dang ky hoc phan', 'module' => 'student'],
            ['code' => 'student.enrollment.edit', 'name' => 'Dang ky hoc phan', 'module' => 'student'],
            ['code' => 'admin.academic-term.manage', 'name' => 'Quan ly nam hoc hoc ky', 'module' => 'admin'],
            ['code' => 'admin.window.manage', 'name' => 'Quan ly cua so thoi gian hoc vu', 'module' => 'admin'],
            ['code' => 'admin.grade-entry.lock.manage', 'name' => 'Khoa mo nhap diem theo hoc ky', 'module' => 'admin'],
        ];

        foreach ($permissions as $permission) {
            Permission::query()->updateOrCreate(
                ['code' => $permission['code']],
                [
                    'name' => $permission['name'],
                    'module' => $permission['module'],
                    'description' => null,
                ],
            );
        }

        $studentRole = Role::query()->where('code', 'student')->firstOrFail();
        $lecturerRole = Role::query()->where('code', 'lecturer')->firstOrFail();
        $trainingOfficerRole = Role::query()->where('code', 'training_officer')->firstOrFail();
        $managerRole = Role::query()->where('code', 'manager')->firstOrFail();
        $adminRole = Role::query()->where('code', 'admin')->firstOrFail();
        $studentPermissionIds = Permission::query()->where('module', 'student')->pluck('id');
        $studentRole->permissions()->sync($studentPermissionIds);
        $adminRole->permissions()->sync(Permission::query()->pluck('id'));

        User::query()->updateOrCreate(
            ['username' => '65133141'],
            [
                'password' => bcrypt(self::DEFAULT_PASSWORD),
                'role_id' => $studentRole->id,
                'status' => true,
            ],
        );

        SinhVien::query()->updateOrCreate(
            ['user_id' => '65133141'],
            [
                'ten_sinh_vien' => 'Sinh vien 65133141',
                'ma_lop' => '65.CNTT-1',
                'email' => '65133141@students.ntu.edu.vn',
            ],
        );

        User::query()->updateOrCreate(
            ['username' => '2025001'],
            [
                'password' => bcrypt(self::DEFAULT_PASSWORD),
                'role_id' => $lecturerRole->id,
                'status' => true,
            ],
        );

        CanBo::query()->updateOrCreate(
            ['user_id' => '2025001'],
            [
                'ten_giang_vien' => 'Can bo 2025001',
                'email' => '2025001@ntu.edu.vn',
            ],
        );

        User::query()->updateOrCreate(
            ['username' => 'ntthuong'],
            [
                'password' => bcrypt(self::DEFAULT_PASSWORD),
                'role_id' => $trainingOfficerRole->id,
                'status' => true,
            ],
        );

        ChuyenVien::query()->updateOrCreate(
            ['user_id' => 'ntthuong'],
            [
                'ten_chuyen_vien' => 'Chuyen vien ntthuong',
                'email' => 'ntthuong@ntu.edu.vn',
            ],
        );

        User::query()->updateOrCreate(
            ['username' => 'bcthanh'],
            [
                'password' => bcrypt(self::DEFAULT_PASSWORD),
                'role_id' => $managerRole->id,
                'status' => true,
            ],
        );

        QuanLy::query()->updateOrCreate(
            ['user_id' => 'bcthanh'],
            [
                'ten_nguoi_quan_ly' => 'Quan ly bcthanh',
                'email' => 'bcthanh@ntu.edu.vn',
            ],
        );
    }
}
