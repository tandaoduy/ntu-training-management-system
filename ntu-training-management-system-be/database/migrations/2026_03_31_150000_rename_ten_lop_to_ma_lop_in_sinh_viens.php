<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('sinh_viens')
            && Schema::hasColumn('sinh_viens', 'ten_lop')
            && ! Schema::hasColumn('sinh_viens', 'ma_lop')) {
            DB::statement('ALTER TABLE sinh_viens RENAME COLUMN ten_lop TO ma_lop');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('sinh_viens')
            && Schema::hasColumn('sinh_viens', 'ma_lop')
            && ! Schema::hasColumn('sinh_viens', 'ten_lop')) {
            DB::statement('ALTER TABLE sinh_viens RENAME COLUMN ma_lop TO ten_lop');
        }
    }
};
