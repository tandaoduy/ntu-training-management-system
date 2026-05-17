<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('giang_duongs', function (Blueprint $table): void {
            $table->id();
            $table->string('ma_giang_duong', 50)->unique();
            $table->string('ten_giang_duong', 255);
            $table->string('mo_ta', 500)->nullable();
            $table->timestamps();
        });

        Schema::create('phong_hocs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('giang_duong_id')->constrained('giang_duongs')->cascadeOnDelete();
            $table->string('ma_phong', 50)->unique();
            $table->unsignedInteger('suc_chua');
            $table->timestamps();
        });

        Schema::create('cau_hinh_tuan_hocs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('hoc_ky_id')->unique()->constrained('hoc_kys')->cascadeOnDelete();
            $table->date('tuan_1_bat_dau');
            $table->unsignedTinyInteger('so_tuan_mac_dinh')->default(19);
            $table->timestamps();
        });

        Schema::create('thoi_khoa_bieus', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('lop_hoc_phan_id')->constrained('lops')->cascadeOnDelete();
            $table->foreignId('phong_hoc_id')->constrained('phong_hocs')->cascadeOnDelete();
            $table->foreignId('hoc_ky_id')->constrained('hoc_kys')->cascadeOnDelete();
            $table->unsignedTinyInteger('thu');
            $table->unsignedTinyInteger('tiet_bat_dau');
            $table->unsignedTinyInteger('so_tiet');
            $table->unsignedTinyInteger('tiet_ket_thuc');
            $table->unsignedTinyInteger('tuan_bat_dau');
            $table->unsignedTinyInteger('so_tuan');
            $table->unsignedTinyInteger('tuan_ket_thuc');
            $table->string('created_by', 100)->nullable();
            $table->timestamps();

            $table->index(['hoc_ky_id', 'phong_hoc_id', 'thu']);
            $table->index(['lop_hoc_phan_id', 'hoc_ky_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('thoi_khoa_bieus');
        Schema::dropIfExists('cau_hinh_tuan_hocs');
        Schema::dropIfExists('phong_hocs');
        Schema::dropIfExists('giang_duongs');
    }
};
