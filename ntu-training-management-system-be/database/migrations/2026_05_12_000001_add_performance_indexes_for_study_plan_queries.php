<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('CREATE INDEX IF NOT EXISTS khht_period_status_window_id_idx ON ke_hoach_hoc_tap_dot_dang_kys (status, starts_at, ends_at, id DESC)');
        DB::statement('CREATE INDEX IF NOT EXISTS khht_period_target_id_idx ON ke_hoach_hoc_tap_dot_dang_kys (target_hoc_ky_id, id DESC)');
        DB::statement('CREATE INDEX IF NOT EXISTS khht_student_period_status_idx ON ke_hoach_hoc_taps (sinh_vien_id, dot_dang_ky_id, status)');
        DB::statement('CREATE INDEX IF NOT EXISTS khht_term_status_student_idx ON ke_hoach_hoc_taps (hoc_ky_id, status, sinh_vien_id)');
        DB::statement('CREATE INDEX IF NOT EXISTS khht_detail_term_plan_course_idx ON ke_hoach_hoc_tap_chi_tiets (hoc_ky_id, ke_hoach_hoc_tap_id, hoc_phan_id)');
        DB::statement('CREATE INDEX IF NOT EXISTS khht_detail_plan_term_course_idx ON ke_hoach_hoc_tap_chi_tiets (ke_hoach_hoc_tap_id, hoc_ky_id, hoc_phan_id)');
        DB::statement('CREATE INDEX IF NOT EXISTS svct_student_locked_latest_idx ON sinh_vien_chuong_trinhs (sinh_vien_id, locked, id DESC)');
        DB::statement('CREATE INDEX IF NOT EXISTS nhom_hp_version_order_idx ON nhom_hoc_phans (phien_ban_ctdt_id, thu_tu, id)');
        DB::statement('CREATE INDEX IF NOT EXISTS pbctdt_hp_version_group_course_idx ON phien_ban_ctdt_hoc_phans (phien_ban_ctdt_id, nhom_hoc_phan_id, hoc_phan_id)');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS pbctdt_hp_version_group_course_idx');
        DB::statement('DROP INDEX IF EXISTS nhom_hp_version_order_idx');
        DB::statement('DROP INDEX IF EXISTS svct_student_locked_latest_idx');
        DB::statement('DROP INDEX IF EXISTS khht_detail_plan_term_course_idx');
        DB::statement('DROP INDEX IF EXISTS khht_detail_term_plan_course_idx');
        DB::statement('DROP INDEX IF EXISTS khht_term_status_student_idx');
        DB::statement('DROP INDEX IF EXISTS khht_student_period_status_idx');
        DB::statement('DROP INDEX IF EXISTS khht_period_target_id_idx');
        DB::statement('DROP INDEX IF EXISTS khht_period_status_window_id_idx');
    }
};
