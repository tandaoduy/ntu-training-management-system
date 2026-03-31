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
        DB::statement('ALTER TABLE sinh_viens DROP CONSTRAINT IF EXISTS sinh_viens_user_id_foreign');
        DB::statement("ALTER TABLE sinh_viens ADD COLUMN IF NOT EXISTS user_code VARCHAR(50)");
        DB::statement("UPDATE sinh_viens SET user_code = ma_sinh_vien WHERE user_code IS NULL");
        DB::statement('ALTER TABLE sinh_viens ALTER COLUMN user_code SET NOT NULL');
        DB::statement('ALTER TABLE sinh_viens DROP COLUMN IF EXISTS user_id');
        DB::statement('ALTER TABLE sinh_viens DROP COLUMN IF EXISTS ma_sinh_vien');
        DB::statement('ALTER TABLE sinh_viens RENAME COLUMN user_code TO user_id');
        DB::statement('ALTER TABLE sinh_viens ADD CONSTRAINT sinh_viens_user_id_unique UNIQUE (user_id)');
        DB::statement('ALTER TABLE sinh_viens ADD CONSTRAINT sinh_viens_user_id_foreign FOREIGN KEY (user_id) REFERENCES users(username) ON DELETE CASCADE');

        DB::statement("ALTER TABLE can_bos ADD COLUMN IF NOT EXISTS user_id VARCHAR(50)");
        DB::statement("UPDATE can_bos SET user_id = ma_giang_vien WHERE user_id IS NULL");
        DB::statement('ALTER TABLE can_bos ALTER COLUMN user_id SET NOT NULL');
        DB::statement('ALTER TABLE can_bos DROP COLUMN IF EXISTS ma_giang_vien');
        DB::statement('ALTER TABLE can_bos ADD CONSTRAINT can_bos_user_id_unique UNIQUE (user_id)');
        DB::statement('ALTER TABLE can_bos ADD CONSTRAINT can_bos_user_id_foreign FOREIGN KEY (user_id) REFERENCES users(username) ON DELETE CASCADE');

        DB::statement("ALTER TABLE chuyen_viens ADD COLUMN IF NOT EXISTS user_id VARCHAR(50)");
        DB::statement("UPDATE chuyen_viens SET user_id = ma_chuyen_vien WHERE user_id IS NULL");
        DB::statement('ALTER TABLE chuyen_viens ALTER COLUMN user_id SET NOT NULL');
        DB::statement('ALTER TABLE chuyen_viens DROP COLUMN IF EXISTS ma_chuyen_vien');
        DB::statement('ALTER TABLE chuyen_viens ADD CONSTRAINT chuyen_viens_user_id_unique UNIQUE (user_id)');
        DB::statement('ALTER TABLE chuyen_viens ADD CONSTRAINT chuyen_viens_user_id_foreign FOREIGN KEY (user_id) REFERENCES users(username) ON DELETE CASCADE');

        DB::statement("ALTER TABLE quan_lys ADD COLUMN IF NOT EXISTS user_id VARCHAR(50)");
        DB::statement("UPDATE quan_lys SET user_id = ma_quan_ly WHERE user_id IS NULL");
        DB::statement('ALTER TABLE quan_lys ALTER COLUMN user_id SET NOT NULL');
        DB::statement('ALTER TABLE quan_lys DROP COLUMN IF EXISTS ma_quan_ly');
        DB::statement('ALTER TABLE quan_lys ADD CONSTRAINT quan_lys_user_id_unique UNIQUE (user_id)');
        DB::statement('ALTER TABLE quan_lys ADD CONSTRAINT quan_lys_user_id_foreign FOREIGN KEY (user_id) REFERENCES users(username) ON DELETE CASCADE');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE quan_lys DROP CONSTRAINT IF EXISTS quan_lys_user_id_foreign');
        DB::statement('ALTER TABLE quan_lys DROP CONSTRAINT IF EXISTS quan_lys_user_id_unique');
        DB::statement("ALTER TABLE quan_lys ADD COLUMN IF NOT EXISTS ma_quan_ly VARCHAR(50)");
        DB::statement('UPDATE quan_lys SET ma_quan_ly = user_id WHERE ma_quan_ly IS NULL');
        DB::statement('ALTER TABLE quan_lys ALTER COLUMN ma_quan_ly SET NOT NULL');
        DB::statement('ALTER TABLE quan_lys ADD CONSTRAINT quan_lys_ma_quan_ly_unique UNIQUE (ma_quan_ly)');
        DB::statement('ALTER TABLE quan_lys DROP COLUMN IF EXISTS user_id');

        DB::statement('ALTER TABLE chuyen_viens DROP CONSTRAINT IF EXISTS chuyen_viens_user_id_foreign');
        DB::statement('ALTER TABLE chuyen_viens DROP CONSTRAINT IF EXISTS chuyen_viens_user_id_unique');
        DB::statement("ALTER TABLE chuyen_viens ADD COLUMN IF NOT EXISTS ma_chuyen_vien VARCHAR(50)");
        DB::statement('UPDATE chuyen_viens SET ma_chuyen_vien = user_id WHERE ma_chuyen_vien IS NULL');
        DB::statement('ALTER TABLE chuyen_viens ALTER COLUMN ma_chuyen_vien SET NOT NULL');
        DB::statement('ALTER TABLE chuyen_viens ADD CONSTRAINT chuyen_viens_ma_chuyen_vien_unique UNIQUE (ma_chuyen_vien)');
        DB::statement('ALTER TABLE chuyen_viens DROP COLUMN IF EXISTS user_id');

        DB::statement('ALTER TABLE can_bos DROP CONSTRAINT IF EXISTS can_bos_user_id_foreign');
        DB::statement('ALTER TABLE can_bos DROP CONSTRAINT IF EXISTS can_bos_user_id_unique');
        DB::statement("ALTER TABLE can_bos ADD COLUMN IF NOT EXISTS ma_giang_vien VARCHAR(50)");
        DB::statement('UPDATE can_bos SET ma_giang_vien = user_id WHERE ma_giang_vien IS NULL');
        DB::statement('ALTER TABLE can_bos ALTER COLUMN ma_giang_vien SET NOT NULL');
        DB::statement('ALTER TABLE can_bos ADD CONSTRAINT can_bos_ma_giang_vien_unique UNIQUE (ma_giang_vien)');
        DB::statement('ALTER TABLE can_bos DROP COLUMN IF EXISTS user_id');

        DB::statement('ALTER TABLE sinh_viens DROP CONSTRAINT IF EXISTS sinh_viens_user_id_foreign');
        DB::statement('ALTER TABLE sinh_viens DROP CONSTRAINT IF EXISTS sinh_viens_user_id_unique');
        DB::statement("ALTER TABLE sinh_viens ADD COLUMN IF NOT EXISTS ma_sinh_vien VARCHAR(50)");
        DB::statement('UPDATE sinh_viens SET ma_sinh_vien = user_id WHERE ma_sinh_vien IS NULL');
        DB::statement('ALTER TABLE sinh_viens ALTER COLUMN ma_sinh_vien SET NOT NULL');
        DB::statement('ALTER TABLE sinh_viens ADD CONSTRAINT sinh_viens_ma_sinh_vien_unique UNIQUE (ma_sinh_vien)');
        DB::statement('ALTER TABLE sinh_viens DROP COLUMN IF EXISTS user_id');

        DB::statement('ALTER TABLE sinh_viens ADD COLUMN IF NOT EXISTS user_id BIGINT');
        DB::statement('ALTER TABLE sinh_viens ADD CONSTRAINT sinh_viens_user_id_foreign FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE');
    }
};
