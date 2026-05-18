<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('thoi_khoa_bieus', function (Blueprint $table): void {
            if (! Schema::hasColumn('thoi_khoa_bieus', 'ma_hoc_phan_snapshot')) {
                $table->string('ma_hoc_phan_snapshot', 50)->nullable()->after('hoc_ky_id');
            }
            if (! Schema::hasColumn('thoi_khoa_bieus', 'ten_hoc_phan_snapshot')) {
                $table->string('ten_hoc_phan_snapshot', 255)->nullable()->after('ma_hoc_phan_snapshot');
            }
            if (! Schema::hasColumn('thoi_khoa_bieus', 'lop_hoc_phan_snapshot')) {
                $table->string('lop_hoc_phan_snapshot', 255)->nullable()->after('ten_hoc_phan_snapshot');
            }
            if (! Schema::hasColumn('thoi_khoa_bieus', 'ten_giang_vien_snapshot')) {
                $table->string('ten_giang_vien_snapshot', 255)->nullable()->after('lop_hoc_phan_snapshot');
            }
            if (! Schema::hasColumn('thoi_khoa_bieus', 'giang_vien_id_snapshot')) {
                $table->unsignedBigInteger('giang_vien_id_snapshot')->nullable()->after('ten_giang_vien_snapshot');
            }
            if (! Schema::hasColumn('thoi_khoa_bieus', 'si_so_snapshot')) {
                $table->unsignedInteger('si_so_snapshot')->nullable()->after('giang_vien_id_snapshot');
            }
            if (! Schema::hasColumn('thoi_khoa_bieus', 'ma_phong_snapshot')) {
                $table->string('ma_phong_snapshot', 50)->nullable()->after('phong_hoc_id');
            }
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement(
                'UPDATE thoi_khoa_bieus tkb
                SET ma_hoc_phan_snapshot = COALESCE(tkb.ma_hoc_phan_snapshot, lhp.ma_hoc_phan),
                    ten_hoc_phan_snapshot = COALESCE(tkb.ten_hoc_phan_snapshot, lhp.ten_hoc_phan),
                    lop_hoc_phan_snapshot = COALESCE(tkb.lop_hoc_phan_snapshot, lhp.lop_hoc_phan),
                    ten_giang_vien_snapshot = COALESCE(tkb.ten_giang_vien_snapshot, lhp.ten_giang_vien),
                    giang_vien_id_snapshot = COALESCE(tkb.giang_vien_id_snapshot, lhp.giang_vien_id),
                    si_so_snapshot = COALESCE(tkb.si_so_snapshot, lhp.si_so)
                FROM lop_hoc_phans lhp
                WHERE lhp.id = tkb.lop_hoc_phan_id'
            );

            DB::statement(
                'UPDATE thoi_khoa_bieus tkb
                SET ma_phong_snapshot = COALESCE(tkb.ma_phong_snapshot, ph.ma_phong)
                FROM phong_hocs ph
                WHERE ph.id = tkb.phong_hoc_id'
            );

            DB::statement('ALTER TABLE thoi_khoa_bieus DROP CONSTRAINT IF EXISTS thoi_khoa_bieus_lop_hoc_phan_id_foreign');
            DB::statement('ALTER TABLE thoi_khoa_bieus ALTER COLUMN lop_hoc_phan_id DROP NOT NULL');
            DB::statement(
                'ALTER TABLE thoi_khoa_bieus
                ADD CONSTRAINT thoi_khoa_bieus_lop_hoc_phan_id_foreign
                FOREIGN KEY (lop_hoc_phan_id) REFERENCES lop_hoc_phans(id) ON DELETE SET NULL'
            );

            DB::statement('ALTER TABLE thoi_khoa_bieus DROP CONSTRAINT IF EXISTS thoi_khoa_bieus_phong_hoc_id_foreign');
            DB::statement('ALTER TABLE thoi_khoa_bieus ALTER COLUMN phong_hoc_id DROP NOT NULL');
            DB::statement(
                'ALTER TABLE thoi_khoa_bieus
                ADD CONSTRAINT thoi_khoa_bieus_phong_hoc_id_foreign
                FOREIGN KEY (phong_hoc_id) REFERENCES phong_hocs(id) ON DELETE SET NULL'
            );
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE thoi_khoa_bieus DROP CONSTRAINT IF EXISTS thoi_khoa_bieus_lop_hoc_phan_id_foreign');
            DB::statement('ALTER TABLE thoi_khoa_bieus DROP CONSTRAINT IF EXISTS thoi_khoa_bieus_phong_hoc_id_foreign');
        }

        Schema::table('thoi_khoa_bieus', function (Blueprint $table): void {
            foreach ([
                'ma_hoc_phan_snapshot',
                'ten_hoc_phan_snapshot',
                'lop_hoc_phan_snapshot',
                'ten_giang_vien_snapshot',
                'giang_vien_id_snapshot',
                'si_so_snapshot',
                'ma_phong_snapshot',
            ] as $column) {
                if (Schema::hasColumn('thoi_khoa_bieus', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
