<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const DEFAULT_ADMIN_PASSWORD_HASH = '$2y$12$iRqYkoc7ufQMmYJjQ2d2zOWBbDBrSQlE8HWiN1p7OfukXiEwShcgi';

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $now = now();

        $adminRole = DB::table('roles')->where('code', 'admin')->first();

        if (! $adminRole) {
            $adminRoleId = DB::table('roles')->insertGetId([
                'code' => 'admin',
                'name' => 'Quan tri he thong',
                'description' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        } else {
            $adminRoleId = $adminRole->id;
        }

        $existingAdmin = DB::table('users')->where('username', 'Admin')->first();

        if (! $existingAdmin) {
            DB::table('users')->insert([
                'username' => 'Admin',
                'password' => self::DEFAULT_ADMIN_PASSWORD_HASH,
                'role_id' => $adminRoleId,
                'status' => true,
                'last_login_at' => null,
                'remember_token' => null,
                'profile_id' => null,
                'profile_type' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            return;
        }

        DB::table('users')
            ->where('id', $existingAdmin->id)
            ->update([
                'password' => self::DEFAULT_ADMIN_PASSWORD_HASH,
                'role_id' => $adminRoleId,
                'status' => true,
                'updated_at' => $now,
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('users')->where('username', 'Admin')->delete();
    }
};
