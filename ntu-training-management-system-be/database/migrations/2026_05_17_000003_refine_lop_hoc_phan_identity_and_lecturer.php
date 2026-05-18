<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lop_hoc_phans', function (Blueprint $table): void {
            if (! Schema::hasColumn('lop_hoc_phans', 'giang_vien_id')) {
                $table->foreignId('giang_vien_id')
                    ->nullable()
                    ->after('lop_hanh_chinh_id')
                    ->constrained('can_bos')
                    ->nullOnDelete();
            }
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE lop_hoc_phans DROP CONSTRAINT IF EXISTS lhp_hoc_ky_lop_unique');
            DB::statement(
                'CREATE UNIQUE INDEX IF NOT EXISTS lhp_hoc_ky_hp_lop_unique
                ON lop_hoc_phans (hoc_ky_id, hoc_phan_id, lop_hoc_phan)
                WHERE hoc_phan_id IS NOT NULL'
            );
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS lhp_hoc_ky_hp_lop_unique');
        }

        Schema::table('lop_hoc_phans', function (Blueprint $table): void {
            if (Schema::hasColumn('lop_hoc_phans', 'giang_vien_id')) {
                $table->dropConstrainedForeignId('giang_vien_id');
            }
        });
    }
};
