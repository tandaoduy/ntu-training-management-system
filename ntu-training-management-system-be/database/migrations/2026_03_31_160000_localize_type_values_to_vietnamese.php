<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement('ALTER TABLE don_vis DROP CONSTRAINT IF EXISTS don_vis_loai_don_vi_check');
        DB::statement("UPDATE don_vis SET loai_don_vi = 'Đào tạo' WHERE loai_don_vi = 'dao_tao'");
        DB::statement("UPDATE don_vis SET loai_don_vi = 'Quản lý' WHERE loai_don_vi = 'quan_ly'");
        DB::statement("ALTER TABLE don_vis ADD CONSTRAINT don_vis_loai_don_vi_check CHECK (loai_don_vi IN ('Đào tạo', 'Quản lý'))");

        DB::statement('ALTER TABLE nganh_dao_taos DROP CONSTRAINT IF EXISTS nganh_dao_taos_he_dao_tao_check');
        DB::statement("UPDATE nganh_dao_taos SET he_dao_tao = 'Chính quy' WHERE he_dao_tao = 'chinh_quy'");
        DB::statement("UPDATE nganh_dao_taos SET he_dao_tao = 'Vừa học vừa làm' WHERE he_dao_tao = 'vua_hoc_vua_lam'");
        DB::statement("UPDATE nganh_dao_taos SET he_dao_tao = 'Đào tạo từ xa' WHERE he_dao_tao = 'dao_tao_tu_xa'");
        DB::statement("ALTER TABLE nganh_dao_taos ADD CONSTRAINT nganh_dao_taos_he_dao_tao_check CHECK (he_dao_tao IN ('Chính quy', 'Vừa học vừa làm', 'Đào tạo từ xa'))");

        DB::statement('ALTER TABLE sinh_viens DROP CONSTRAINT IF EXISTS sinh_viens_he_dao_tao_check');
        DB::statement("UPDATE sinh_viens SET he_dao_tao = 'Chính quy' WHERE he_dao_tao = 'chinh_quy'");
        DB::statement("UPDATE sinh_viens SET he_dao_tao = 'Vừa học vừa làm' WHERE he_dao_tao = 'vua_hoc_vua_lam'");
        DB::statement("UPDATE sinh_viens SET he_dao_tao = 'Đào tạo từ xa' WHERE he_dao_tao = 'dao_tao_tu_xa'");
        DB::statement("ALTER TABLE sinh_viens ADD CONSTRAINT sinh_viens_he_dao_tao_check CHECK (he_dao_tao IS NULL OR he_dao_tao IN ('Chính quy', 'Vừa học vừa làm', 'Đào tạo từ xa'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE sinh_viens DROP CONSTRAINT IF EXISTS sinh_viens_he_dao_tao_check');
        DB::statement("UPDATE sinh_viens SET he_dao_tao = 'chinh_quy' WHERE he_dao_tao = 'Chính quy'");
        DB::statement("UPDATE sinh_viens SET he_dao_tao = 'vua_hoc_vua_lam' WHERE he_dao_tao = 'Vừa học vừa làm'");
        DB::statement("UPDATE sinh_viens SET he_dao_tao = 'dao_tao_tu_xa' WHERE he_dao_tao = 'Đào tạo từ xa'");
        DB::statement("ALTER TABLE sinh_viens ADD CONSTRAINT sinh_viens_he_dao_tao_check CHECK (he_dao_tao IS NULL OR he_dao_tao IN ('chinh_quy', 'vua_hoc_vua_lam', 'dao_tao_tu_xa'))");

        DB::statement('ALTER TABLE nganh_dao_taos DROP CONSTRAINT IF EXISTS nganh_dao_taos_he_dao_tao_check');
        DB::statement("UPDATE nganh_dao_taos SET he_dao_tao = 'chinh_quy' WHERE he_dao_tao = 'Chính quy'");
        DB::statement("UPDATE nganh_dao_taos SET he_dao_tao = 'vua_hoc_vua_lam' WHERE he_dao_tao = 'Vừa học vừa làm'");
        DB::statement("UPDATE nganh_dao_taos SET he_dao_tao = 'dao_tao_tu_xa' WHERE he_dao_tao = 'Đào tạo từ xa'");
        DB::statement("ALTER TABLE nganh_dao_taos ADD CONSTRAINT nganh_dao_taos_he_dao_tao_check CHECK (he_dao_tao IN ('chinh_quy', 'vua_hoc_vua_lam', 'dao_tao_tu_xa'))");

        DB::statement('ALTER TABLE don_vis DROP CONSTRAINT IF EXISTS don_vis_loai_don_vi_check');
        DB::statement("UPDATE don_vis SET loai_don_vi = 'dao_tao' WHERE loai_don_vi = 'Đào tạo'");
        DB::statement("UPDATE don_vis SET loai_don_vi = 'quan_ly' WHERE loai_don_vi = 'Quản lý'");
        DB::statement("ALTER TABLE don_vis ADD CONSTRAINT don_vis_loai_don_vi_check CHECK (loai_don_vi IN ('dao_tao', 'quan_ly'))");
    }
};
