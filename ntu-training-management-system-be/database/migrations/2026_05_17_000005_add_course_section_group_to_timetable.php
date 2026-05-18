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
            if (! Schema::hasColumn('lop_hoc_phans', 'nhom_hoc_phan')) {
                $table->string('nhom_hoc_phan', 50)->nullable()->after('lop_hoc_phan');
            }
        });

        Schema::table('thoi_khoa_bieus', function (Blueprint $table): void {
            if (! Schema::hasColumn('thoi_khoa_bieus', 'nhom_hoc_phan_snapshot')) {
                $table->string('nhom_hoc_phan_snapshot', 50)->nullable()->after('lop_hoc_phan_snapshot');
            }
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement(
                "UPDATE lop_hoc_phans
                SET nhom_hoc_phan = COALESCE(
                    nhom_hoc_phan,
                    LPAD(NULLIF(substring(lop_hoc_phan FROM '([0-9]+)$'), ''), 2, '0'),
                    '01'
                )"
            );

            DB::statement(
                'UPDATE thoi_khoa_bieus tkb
                SET nhom_hoc_phan_snapshot = COALESCE(tkb.nhom_hoc_phan_snapshot, lhp.nhom_hoc_phan)
                FROM lop_hoc_phans lhp
                WHERE lhp.id = tkb.lop_hoc_phan_id'
            );

            DB::statement('DROP INDEX IF EXISTS lhp_hoc_ky_hp_lop_unique');
            DB::statement('DROP INDEX IF EXISTS lhp_hoc_ky_hp_nhom_lop_unique');
            DB::statement(
                'CREATE UNIQUE INDEX lhp_hoc_ky_hp_nhom_lop_unique
                ON lop_hoc_phans (hoc_ky_id, hoc_phan_id, nhom_hoc_phan, lop_hoc_phan)
                WHERE hoc_phan_id IS NOT NULL'
            );
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS lhp_hoc_ky_hp_nhom_lop_unique');
            DB::statement(
                'CREATE UNIQUE INDEX IF NOT EXISTS lhp_hoc_ky_hp_lop_unique
                ON lop_hoc_phans (hoc_ky_id, hoc_phan_id, lop_hoc_phan)
                WHERE hoc_phan_id IS NOT NULL'
            );
        }

        Schema::table('thoi_khoa_bieus', function (Blueprint $table): void {
            if (Schema::hasColumn('thoi_khoa_bieus', 'nhom_hoc_phan_snapshot')) {
                $table->dropColumn('nhom_hoc_phan_snapshot');
            }
        });

        Schema::table('lop_hoc_phans', function (Blueprint $table): void {
            if (Schema::hasColumn('lop_hoc_phans', 'nhom_hoc_phan')) {
                $table->dropColumn('nhom_hoc_phan');
            }
        });
    }
};
