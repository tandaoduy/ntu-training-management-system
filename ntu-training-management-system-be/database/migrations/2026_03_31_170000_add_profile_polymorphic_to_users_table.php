<?php

use App\Models\CanBo;
use App\Models\ChuyenVien;
use App\Models\QuanLy;
use App\Models\SinhVien;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            if (! Schema::hasColumn('users', 'profile_id')) {
                $table->unsignedBigInteger('profile_id')->nullable()->after('role_id');
            }

            if (! Schema::hasColumn('users', 'profile_type')) {
                $table->string('profile_type')->nullable()->after('profile_id');
            }

            $table->index(['profile_type', 'profile_id']);
        });

        DB::statement("UPDATE users u SET profile_id = sv.id, profile_type = 'App\\Models\\SinhVien' FROM sinh_viens sv, roles r WHERE u.username = sv.user_id AND r.id = u.role_id AND r.code = 'student'");
        DB::statement("UPDATE users u SET profile_id = cb.id, profile_type = 'App\\Models\\CanBo' FROM can_bos cb, roles r WHERE u.username = cb.user_id AND r.id = u.role_id AND r.code = 'lecturer'");
        DB::statement("UPDATE users u SET profile_id = cv.id, profile_type = 'App\\Models\\ChuyenVien' FROM chuyen_viens cv, roles r WHERE u.username = cv.user_id AND r.id = u.role_id AND r.code = 'training_officer'");
        DB::statement("UPDATE users u SET profile_id = ql.id, profile_type = 'App\\Models\\QuanLy' FROM quan_lys ql, roles r WHERE u.username = ql.user_id AND r.id = u.role_id AND r.code = 'manager'");

        // For admins or users without profile records, keep profile columns nullable.
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropIndex(['profile_type', 'profile_id']);

            if (Schema::hasColumn('users', 'profile_type')) {
                $table->dropColumn('profile_type');
            }

            if (Schema::hasColumn('users', 'profile_id')) {
                $table->dropColumn('profile_id');
            }
        });
    }
};
