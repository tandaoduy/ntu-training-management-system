<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    /**
     * Seed roles, permissions, and one demo student account.
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
        $studentPermissionIds = Permission::query()->where('module', 'student')->pluck('id');
        $studentRole->permissions()->sync($studentPermissionIds);

        $user = User::query()->updateOrCreate(
            ['username' => '65133141'],
            [
                'password' => bcrypt('123456'),
                'role_id' => $studentRole->id,
                'status' => true,
            ],
        );

        Student::query()->updateOrCreate(
            ['student_code' => '65133141'],
            [
                'user_id' => $user->id,
                'full_name' => 'Dao Duy Tan',
                'class_name' => '65.CNTT-1',
                'major_name' => 'Cong nghe thong tin',
                'email' => 'tan.dd@students.ntu.edu.vn',
                'status' => true,
            ],
        );

        $secondUser = User::query()->updateOrCreate(
            ['username' => '65133414'],
            [
                'password' => bcrypt('123456'),
                'role_id' => $studentRole->id,
                'status' => true,
            ],
        );

        Student::query()->updateOrCreate(
            ['student_code' => '65133414'],
            [
                'user_id' => $secondUser->id,
                'full_name' => 'Sinh vien Mau 2',
                'class_name' => '65.CNTT-1',
                'major_name' => 'Cong nghe thong tin',
                'email' => '65133414@students.ntu.edu.vn',
                'status' => true,
            ],
        );

        $newStudentUser = User::query()->updateOrCreate(
            ['username' => '65130001'],
            [
                'password' => bcrypt('123456789'),
                'role_id' => $studentRole->id,
                'status' => true,
            ],
        );

        Student::query()->updateOrCreate(
            ['student_code' => '65130001'],
            [
                'user_id' => $newStudentUser->id,
                'full_name' => 'Sinh vien Moi',
                'class_name' => '65.CNTT-1',
                'major_name' => 'Cong nghe thong tin',
                'email' => '65130001@students.ntu.edu.vn',
                'status' => true,
            ],
        );

        User::query()->updateOrCreate(
            ['username' => '2025001'],
            [
                'password' => bcrypt('123456789'),
                'role_id' => $lecturerRole->id,
                'status' => true,
            ],
        );
    }
}
