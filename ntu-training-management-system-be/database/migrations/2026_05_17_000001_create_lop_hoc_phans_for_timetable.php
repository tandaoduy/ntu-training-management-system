<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lop_hoc_phans', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('hoc_phan_id')->nullable()->constrained('hoc_phans')->nullOnDelete();
            $table->foreignId('hoc_ky_id')->constrained('hoc_kys')->cascadeOnDelete();
            $table->foreignId('lop_hanh_chinh_id')->nullable()->constrained('lops')->nullOnDelete();
            $table->string('ma_hoc_phan', 50);
            $table->string('ten_hoc_phan', 255);
            $table->string('lop_hoc_phan', 255);
            $table->string('ten_giang_vien', 255)->nullable();
            $table->unsignedInteger('si_so')->default(0);
            $table->boolean('trang_thai')->default(true);
            $table->timestamps();

            $table->index(['hoc_ky_id', 'ma_hoc_phan']);
            $table->unique(['hoc_ky_id', 'lop_hoc_phan'], 'lhp_hoc_ky_lop_unique');
        });

        if (Schema::hasTable('thoi_khoa_bieus') && Schema::hasTable('lops')) {
            $legacySections = DB::table('thoi_khoa_bieus')
                ->join('lops', 'lops.id', '=', 'thoi_khoa_bieus.lop_hoc_phan_id')
                ->select([
                    'lops.id',
                    'thoi_khoa_bieus.hoc_ky_id',
                    'lops.lop_hoc_phan',
                    'lops.ten_hoc_phan',
                    'lops.ten_giang_vien',
                    'lops.si_so',
                    'lops.trang_thai',
                ])
                ->distinct()
                ->get();

            foreach ($legacySections as $section) {
                DB::table('lop_hoc_phans')->updateOrInsert(
                    ['id' => $section->id],
                    [
                        'hoc_ky_id' => $section->hoc_ky_id,
                        'lop_hanh_chinh_id' => $section->id,
                        'ma_hoc_phan' => (string) $section->lop_hoc_phan,
                        'ten_hoc_phan' => $section->ten_hoc_phan ?: 'Chưa cập nhật',
                        'lop_hoc_phan' => (string) $section->lop_hoc_phan,
                        'ten_giang_vien' => $section->ten_giang_vien,
                        'si_so' => (int) $section->si_so,
                        'trang_thai' => (bool) $section->trang_thai,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                );
            }

            if (DB::getDriverName() === 'pgsql' && DB::table('lop_hoc_phans')->exists()) {
                DB::statement("SELECT setval(pg_get_serial_sequence('lop_hoc_phans', 'id'), (SELECT MAX(id) FROM lop_hoc_phans))");
            }
        }

        Schema::table('thoi_khoa_bieus', function (Blueprint $table): void {
            $table->dropForeign(['lop_hoc_phan_id']);
            $table->foreign('lop_hoc_phan_id')->references('id')->on('lop_hoc_phans')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('thoi_khoa_bieus', function (Blueprint $table): void {
            $table->dropForeign(['lop_hoc_phan_id']);
            $table->foreign('lop_hoc_phan_id')->references('id')->on('lops')->cascadeOnDelete();
        });

        Schema::dropIfExists('lop_hoc_phans');
    }
};
