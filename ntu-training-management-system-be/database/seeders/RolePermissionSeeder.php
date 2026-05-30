<?php

namespace Database\Seeders;

use App\Models\CanBo;
use App\Models\ChuyenVien;
use App\Models\Permission;
use App\Models\QuanLy;
use App\Models\Role;
use App\Models\SinhVien;
use App\Models\User;
use App\Models\HeThongCauHinh;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;

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
            ['code' => 'student.dashboard.view', 'name' => 'Xem trang sinh viên', 'module' => 'student'],
            ['code' => 'student.profile.view', 'name' => 'Xem thông tin cá nhân', 'module' => 'student'],
            ['code' => 'student.profile.edit', 'name' => 'Sửa thông tin cá nhân', 'module' => 'student'],
            ['code' => 'student.curriculum.view', 'name' => 'Xem chương trình đào tạo', 'module' => 'student'],
            ['code' => 'student.study-plan.view', 'name' => 'Xem kế hoạch học tập', 'module' => 'student'],
            ['code' => 'student.study-plan.edit', 'name' => 'Đăng ký kế hoạch học tập', 'module' => 'student'],
            ['code' => 'student.timetable.view', 'name' => 'Xem thời khóa biểu', 'module' => 'student'],
            ['code' => 'student.course-registration.view', 'name' => 'Xem đăng ký học phần', 'module' => 'student'],
            ['code' => 'student.course-registration.edit', 'name' => 'Đăng ký học phần', 'module' => 'student'],
            ['code' => 'student.grades.view', 'name' => 'Xem điểm', 'module' => 'student'],
            ['code' => 'lecturer.dashboard.view', 'name' => 'Xem trang giảng viên', 'module' => 'lecturer'],
            ['code' => 'lecturer.curriculum.view', 'name' => 'Xem chương trình đào tạo', 'module' => 'lecturer'],
            ['code' => 'lecturer.grade-entry.manage', 'name' => 'Nhập điểm học phần', 'module' => 'lecturer'],
            ['code' => 'lecturer.timetable.view', 'name' => 'Xem thời khóa biểu giảng viên', 'module' => 'lecturer'],
            ['code' => 'manager.dashboard.view', 'name' => 'Xem trang quản lý', 'module' => 'manager'],
            ['code' => 'manager.curriculum.view', 'name' => 'Xem chương trình đào tạo', 'module' => 'manager'],
            ['code' => 'manager.student-info.view', 'name' => 'Xem thông tin sinh viên', 'module' => 'manager'],
            ['code' => 'manager.grades.view', 'name' => 'Xem và in điểm', 'module' => 'manager'],
            ['code' => 'training_officer.dashboard.view', 'name' => 'Xem trang chuyên viên', 'module' => 'training_officer'],
            ['code' => 'training_officer.curriculum.view', 'name' => 'Xem chương trình đào tạo', 'module' => 'training_officer'],
            ['code' => 'training_officer.study-plan-statistics.view', 'name' => 'Thống kê kế hoạch học tập', 'module' => 'training_officer'],
            ['code' => 'training_officer.timetable.manage', 'name' => 'Sắp xếp thời khóa biểu', 'module' => 'training_officer'],
            ['code' => 'training_officer.course-registration.manage', 'name' => 'Quản lý đăng ký học phần', 'module' => 'training_officer'],
            ['code' => 'training_officer.grades.view', 'name' => 'Xem và in điểm', 'module' => 'training_officer'],
            ['code' => 'training_officer.grades.edit', 'name' => 'Sửa điểm và thêm học phần miễn/hoàn thành', 'module' => 'training_officer'],
            ['code' => 'training_officer.student-info.manage', 'name' => 'Quản lý thông tin sinh viên', 'module' => 'training_officer'],
            ['code' => 'admin.dashboard.view', 'name' => 'Xem trang quản trị', 'module' => 'admin'],
            ['code' => 'admin.permission.manage', 'name' => 'Phân quyền hệ thống', 'module' => 'admin'],
            ['code' => 'admin.account.manage', 'name' => 'Quản lý tài khoản người dùng', 'module' => 'admin'],
            ['code' => 'admin.class.manage', 'name' => 'Quản lý lớp học', 'module' => 'admin'],
            ['code' => 'admin.config.manage', 'name' => 'Cấu hình hệ thống', 'module' => 'admin'],
            ['code' => 'admin.room.manage', 'name' => 'Quản lý phòng học', 'module' => 'admin'],
            ['code' => 'admin.curriculum.manage', 'name' => 'Quản lý chương trình đào tạo', 'module' => 'admin'],
            ['code' => 'admin.study-plan.manage', 'name' => 'Quản lý kế hoạch học tập', 'module' => 'admin'],
            ['code' => 'admin.course-registration.manage', 'name' => 'Quản lý đăng ký học phần', 'module' => 'admin'],
            ['code' => 'admin.grade-entry.lock.manage', 'name' => 'Khóa/mở nhập điểm theo học kỳ', 'module' => 'admin'],
            ['code' => 'admin.student-info.manage', 'name' => 'Quản lý thông tin sinh viên', 'module' => 'admin'],
            ['code' => 'admin.backup.manage', 'name' => 'Sao lưu và phục hồi dữ liệu', 'module' => 'admin'],
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

        Permission::query()
            ->whereNotIn('code', array_column($permissions, 'code'))
            ->delete();

        $studentRole = Role::query()->where('code', 'student')->firstOrFail();
        $lecturerRole = Role::query()->where('code', 'lecturer')->firstOrFail();
        $trainingOfficerRole = Role::query()->where('code', 'training_officer')->firstOrFail();
        $managerRole = Role::query()->where('code', 'manager')->firstOrFail();
        $adminRole = Role::query()->where('code', 'admin')->firstOrFail();
        $initialized = HeThongCauHinh::query()->where('key', 'dynamic_permissions_initialized')->value('value') === '1';

        foreach ([$studentRole, $lecturerRole, $trainingOfficerRole, $managerRole, $adminRole] as $role) {
            Cache::forget(sprintf('role_permissions:%d', $role->id));
        }

        if (! $initialized) {
            $defaultsByRole = [
                'student' => Permission::query()->where('module', 'student')->pluck('id')->all(),
                'lecturer' => Permission::query()->where('module', 'lecturer')->pluck('id')->all(),
                'training_officer' => Permission::query()
                    ->where('module', 'training_officer')
                    ->orWhereIn('code', ['admin.room.manage', 'admin.class.manage'])
                    ->pluck('id')
                    ->all(),
                'manager' => Permission::query()->where('module', 'manager')->pluck('id')->all(),
                'admin' => Permission::query()->pluck('id')->all(),
            ];

            foreach ([
                'student' => $studentRole,
                'lecturer' => $lecturerRole,
                'training_officer' => $trainingOfficerRole,
                'manager' => $managerRole,
                'admin' => $adminRole,
            ] as $roleCode => $role) {
                $role->permissions()->sync($defaultsByRole[$roleCode]);
                Cache::forget(sprintf('role_permissions:%d', $role->id));
            }

            HeThongCauHinh::query()->updateOrCreate(
                ['key' => 'dynamic_permissions_initialized'],
                ['value' => '1', 'updated_by' => 'system'],
            );
        }

        $roomClassInit = HeThongCauHinh::query()->where('key', 'training_officer_room_class_permission_initialized')->value('value') === '1';
        if (! $roomClassInit) {
            $permissionIds = Permission::query()
                ->whereIn('code', ['admin.room.manage', 'admin.class.manage'])
                ->pluck('id')
                ->all();
            if (!empty($permissionIds)) {
                $trainingOfficerRole->permissions()->syncWithoutDetaching($permissionIds);
                Cache::forget(sprintf('role_permissions:%d', $trainingOfficerRole->id));
            }
            HeThongCauHinh::query()->updateOrCreate(
                ['key' => 'training_officer_room_class_permission_initialized'],
                ['value' => '1', 'updated_by' => 'system'],
            );
        }

        $gradeEditInitialized = HeThongCauHinh::query()->where('key', 'training_officer_grades_edit_permission_initialized')->value('value') === '1';
        if (! $gradeEditInitialized) {
            $gradeEditPermissionId = Permission::query()->where('code', 'training_officer.grades.edit')->value('id');
            if ($gradeEditPermissionId) {
                $trainingOfficerRole->permissions()->syncWithoutDetaching([$gradeEditPermissionId]);
                Cache::forget(sprintf('role_permissions:%d', $trainingOfficerRole->id));
            }

            HeThongCauHinh::query()->updateOrCreate(
                ['key' => 'training_officer_grades_edit_permission_initialized'],
                ['value' => '1', 'updated_by' => 'system'],
            );
        }

        $managerRole->permissions()->syncWithoutDetaching(
            Permission::query()->where('module', 'manager')->pluck('id')->all()
        );
        Cache::forget(sprintf('role_permissions:%d', $managerRole->id));

        User::query()
            ->whereIn('username', ['65130001', '65133414'])
            ->where('role_id', $studentRole->id)
            ->delete();

        $studentAccounts = [
            [
                'username' => '65133141',
                'ten_sinh_vien' => 'Đào Duy Tấn',
                'email' => 'tan.dd.65cntt@ntu.edu.vn',
            ],
            [
                'username' => '65131708',
                'ten_sinh_vien' => 'Lê Kim Linh',
                'email' => 'linh.lk.65cntt@ntu.edu.vn',
            ],
        ];

        foreach ($studentAccounts as $studentAccount) {
            $user = User::query()->updateOrCreate(
                ['username' => $studentAccount['username']],
                [
                    'password' => bcrypt(self::DEFAULT_PASSWORD),
                    'role_id' => $studentRole->id,
                    'status' => true,
                ],
            );

            $profile = SinhVien::query()->updateOrCreate(
                ['user_id' => $studentAccount['username']],
                [
                    'ten_sinh_vien' => $studentAccount['ten_sinh_vien'],
                    'ma_lop' => '65.CNTT-1',
                    'email' => $studentAccount['email'],
                ],
            );

            $user->forceFill([
                'profile_id' => $profile->id,
                'profile_type' => SinhVien::class,
            ])->save();
        }

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
