<?php

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
        if (! Schema::hasTable('ket_qua_hoc_taps') || ! Schema::hasTable('hoc_kys')) {
            return;
        }

        Schema::table('ket_qua_hoc_taps', function (Blueprint $table): void {
            if (! Schema::hasColumn('ket_qua_hoc_taps', 'hoc_ky_id')) {
                $table->foreignId('hoc_ky_id')
                    ->nullable()
                    ->after('lan_hoc')
                    ->constrained('hoc_kys')
                    ->nullOnDelete();
            }
        });

        if (Schema::hasTable('nam_hoc_hoc_kys') && Schema::hasColumn('ket_qua_hoc_taps', 'nam_hoc_hoc_ky_id')) {
            DB::statement(
                "UPDATE ket_qua_hoc_taps AS kq
                SET hoc_ky_id = hk.id
                FROM nam_hoc_hoc_kys AS legacy
                JOIN nam_hocs AS nh ON nh.nam_hoc = legacy.nam_hoc
                JOIN hoc_kys AS hk ON hk.nam_hoc_id = nh.id AND hk.hoc_ky = legacy.hoc_ky
                WHERE kq.nam_hoc_hoc_ky_id = legacy.id
                  AND kq.hoc_ky_id IS NULL"
            );
        }

        if (Schema::hasColumn('ket_qua_hoc_taps', 'nam_hoc') && Schema::hasColumn('ket_qua_hoc_taps', 'hoc_ky')) {
            DB::statement(
                "UPDATE ket_qua_hoc_taps AS kq
                SET hoc_ky_id = hk.id
                                FROM nam_hocs AS nh, hoc_kys AS hk
                                WHERE hk.nam_hoc_id = nh.id
                                    AND nh.nam_hoc = kq.nam_hoc
                                    AND hk.hoc_ky = kq.hoc_ky
                  AND kq.hoc_ky_id IS NULL"
            );
        }

        if (Schema::hasColumn('ket_qua_hoc_taps', 'nam_hoc_hoc_ky_id')) {
            DB::statement('DROP INDEX IF EXISTS ket_qua_hoc_tap_sinh_vien_hoc_ky_idx');
            DB::statement('ALTER TABLE ket_qua_hoc_taps DROP CONSTRAINT IF EXISTS ket_qua_hoc_taps_nam_hoc_hoc_ky_id_foreign');

            Schema::table('ket_qua_hoc_taps', function (Blueprint $table): void {
                $table->dropColumn('nam_hoc_hoc_ky_id');
            });
        }

        DB::statement('CREATE INDEX IF NOT EXISTS ket_qua_hoc_tap_sinh_vien_hoc_ky_new_idx ON ket_qua_hoc_taps (sinh_vien_id, hoc_ky_id)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('ket_qua_hoc_taps')) {
            return;
        }

        DB::statement('DROP INDEX IF EXISTS ket_qua_hoc_tap_sinh_vien_hoc_ky_new_idx');

        Schema::table('ket_qua_hoc_taps', function (Blueprint $table): void {
            if (! Schema::hasColumn('ket_qua_hoc_taps', 'nam_hoc_hoc_ky_id')) {
                $table->foreignId('nam_hoc_hoc_ky_id')
                    ->nullable()
                    ->after('lan_hoc');
            }
        });

        if (Schema::hasColumn('ket_qua_hoc_taps', 'hoc_ky_id')) {
            DB::statement('ALTER TABLE ket_qua_hoc_taps DROP CONSTRAINT IF EXISTS ket_qua_hoc_taps_hoc_ky_id_foreign');

            Schema::table('ket_qua_hoc_taps', function (Blueprint $table): void {
                $table->dropColumn('hoc_ky_id');
            });
        }
    }
};
