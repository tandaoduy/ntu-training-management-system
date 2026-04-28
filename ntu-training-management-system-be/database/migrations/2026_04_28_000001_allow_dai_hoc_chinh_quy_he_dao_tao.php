<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE nganh_dao_taos DROP CONSTRAINT IF EXISTS nganh_dao_taos_he_dao_tao_check');
        DB::statement('ALTER TABLE sinh_viens DROP CONSTRAINT IF EXISTS sinh_viens_he_dao_tao_check');

        DB::statement("UPDATE nganh_dao_taos SET he_dao_tao = 'Đại học Chính quy' WHERE he_dao_tao = 'Chính quy'");
        DB::statement("UPDATE sinh_viens SET he_dao_tao = 'Đại học Chính quy' WHERE he_dao_tao = 'Chính quy'");

        DB::statement("ALTER TABLE nganh_dao_taos ADD CONSTRAINT nganh_dao_taos_he_dao_tao_check CHECK (he_dao_tao IN ('Đại học Chính quy', 'Vừa học vừa làm', 'Đào tạo từ xa'))");
        DB::statement("ALTER TABLE sinh_viens ADD CONSTRAINT sinh_viens_he_dao_tao_check CHECK (he_dao_tao IS NULL OR he_dao_tao IN ('Đại học Chính quy', 'Vừa học vừa làm', 'Đào tạo từ xa'))");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE nganh_dao_taos DROP CONSTRAINT IF EXISTS nganh_dao_taos_he_dao_tao_check');
        DB::statement('ALTER TABLE sinh_viens DROP CONSTRAINT IF EXISTS sinh_viens_he_dao_tao_check');

        DB::statement("ALTER TABLE nganh_dao_taos ADD CONSTRAINT nganh_dao_taos_he_dao_tao_check CHECK (he_dao_tao IN ('Đại học Chính quy', 'Vừa học vừa làm', 'Đào tạo từ xa'))");
        DB::statement("ALTER TABLE sinh_viens ADD CONSTRAINT sinh_viens_he_dao_tao_check CHECK (he_dao_tao IS NULL OR he_dao_tao IN ('Đại học Chính quy', 'Vừa học vừa làm', 'Đào tạo từ xa'))");
    }
};
