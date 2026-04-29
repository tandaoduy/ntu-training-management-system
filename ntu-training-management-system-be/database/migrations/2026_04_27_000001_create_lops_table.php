<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lops', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('don_vi_id')->constrained('don_vis')->cascadeOnDelete();
            $table->string('lop_hoc_phan', 255);
            $table->unsignedInteger('si_so')->default(0);
            $table->string('mo_hinh_dao_tao', 50)->default('Tín chỉ');
            $table->string('ma_khoi', 100);
            $table->string('ten_khoi', 255);
            $table->string('ma_don_vi', 50);
            $table->string('ten_don_vi', 255);
            $table->boolean('trang_thai')->default(true);
            $table->timestamps();

            $table->index(['don_vi_id', 'ma_khoi']);
        });

        Schema::table('sinh_viens', function (Blueprint $table): void {
            $table->foreignId('lop_id')->nullable()->after('ma_lop')->constrained('lops')->nullOnDelete();
        });

        DB::table('sinh_viens')
            ->select(['don_vi_id', 'ma_lop'])
            ->whereNotNull('don_vi_id')
            ->whereNotNull('ma_lop')
            ->where('ma_lop', '<>', '')
            ->distinct()
            ->orderBy('ma_lop')
            ->get()
            ->each(function (object $row): void {
                $donVi = DB::table('don_vis')->where('id', $row->don_vi_id)->first();

                if (! $donVi) {
                    return;
                }

                $lopId = DB::table('lops')->insertGetId([
                    'don_vi_id' => $row->don_vi_id,
                    'lop_hoc_phan' => $row->ma_lop,
                    'si_so' => DB::table('sinh_viens')
                        ->where('don_vi_id', $row->don_vi_id)
                        ->where('ma_lop', $row->ma_lop)
                        ->count(),
                    'mo_hinh_dao_tao' => 'Tín chỉ',
                    'ma_khoi' => $row->ma_lop,
                    'ten_khoi' => $row->ma_lop,
                    'ma_don_vi' => $donVi->ma_don_vi,
                    'ten_don_vi' => $donVi->ten_don_vi,
                    'trang_thai' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                DB::table('sinh_viens')
                    ->where('don_vi_id', $row->don_vi_id)
                    ->where('ma_lop', $row->ma_lop)
                    ->update(['lop_id' => $lopId]);
            });
    }

    public function down(): void
    {
        Schema::table('sinh_viens', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('lop_id');
        });

        Schema::dropIfExists('lops');
    }
};
