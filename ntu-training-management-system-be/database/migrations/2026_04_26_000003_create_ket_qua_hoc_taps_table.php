<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ket_qua_hoc_taps', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('sinh_vien_id')->constrained('sinh_viens')->cascadeOnDelete();
            $table->foreignId('hoc_phan_id')->constrained('hoc_phans')->restrictOnDelete();
            $table->unsignedSmallInteger('lan_hoc')->default(1);
            $table->string('hoc_ky', 20)->nullable();
            $table->string('nam_hoc', 20)->nullable();
            $table->decimal('diem_he_10', 4, 2)->nullable();
            $table->string('diem_chu', 5)->nullable();
            $table->unsignedSmallInteger('so_tin_chi_dat')->default(0);
            $table->enum('trang_thai', ['dang_hoc', 'da_dat', 'khong_dat', 'bo_hoc'])->default('dang_hoc');
            $table->date('ngay_cap_nhat_ket_qua')->nullable();
            $table->text('ghi_chu')->nullable();
            $table->timestamps();

            $table->unique(['sinh_vien_id', 'hoc_phan_id', 'lan_hoc'], 'ket_qua_hoc_tap_unique');
            $table->index(['sinh_vien_id', 'hoc_phan_id']);
            $table->index(['sinh_vien_id', 'trang_thai']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ket_qua_hoc_taps');
    }
};
