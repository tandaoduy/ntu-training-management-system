<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('lops')) {
            return;
        }

        Schema::create('lops', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('don_vi_id')->constrained('don_vis')->cascadeOnDelete();
            $table->string('lop_hoc_phan', 255);
            $table->unsignedInteger('si_so')->default(0);
            $table->string('mo_hinh_dao_tao', 100)->default('Theo tín chỉ');
            $table->string('ma_khoi', 100);
            $table->string('ten_khoi', 255)->nullable();
            $table->string('ma_don_vi', 50);
            $table->string('ten_don_vi', 255);
            $table->boolean('trang_thai')->default(true);
            $table->timestamps();

            $table->index('don_vi_id');
            $table->unique(['don_vi_id', 'ma_khoi', 'lop_hoc_phan'], 'lops_don_vi_ma_khoi_lhp_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lops');
    }
};
