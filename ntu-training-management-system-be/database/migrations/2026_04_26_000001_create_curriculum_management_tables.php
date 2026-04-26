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
        Schema::create('chuyen_nganhs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('nganh_dao_tao_id')->constrained('nganh_dao_taos')->cascadeOnDelete();
            $table->string('ma_chuyen_nganh', 50)->unique();
            $table->string('ten_chuyen_nganh', 255);
            $table->string('mo_ta', 500)->nullable();
            $table->timestamps();
        });

        Schema::create('khoa_tuyen_sinhs', function (Blueprint $table): void {
            $table->id();
            $table->string('ma_khoa', 20)->unique();
            $table->unsignedSmallInteger('nam_bat_dau');
            $table->unsignedSmallInteger('nam_ket_thuc')->nullable();
            $table->string('mo_ta', 500)->nullable();
            $table->timestamps();
        });

        Schema::create('chuong_trinh_dao_taos', function (Blueprint $table): void {
            $table->id();
            $table->string('ma_ctdt', 50)->unique();
            $table->string('ten_ctdt', 255);
            $table->foreignId('nganh_dao_tao_id')->constrained('nganh_dao_taos')->cascadeOnDelete();
            $table->foreignId('chuyen_nganh_id')->nullable()->constrained('chuyen_nganhs')->nullOnDelete();
            $table->foreignId('khoa_tuyen_sinh_id')->constrained('khoa_tuyen_sinhs')->cascadeOnDelete();
            $table->unsignedSmallInteger('tong_tin_chi_yeu_cau')->nullable();
            $table->text('mo_ta')->nullable();
            $table->timestamps();
        });

        Schema::create('phien_ban_ctdts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('chuong_trinh_dao_tao_id')->constrained('chuong_trinh_dao_taos')->cascadeOnDelete();
            $table->unsignedSmallInteger('version_no');
            $table->date('hieu_luc_tu')->nullable();
            $table->date('hieu_luc_den')->nullable();
            $table->enum('trang_thai', ['draft', 'published', 'archived'])->default('draft');
            $table->text('ghi_chu')->nullable();
            $table->timestamps();

            $table->unique(['chuong_trinh_dao_tao_id', 'version_no']);
        });

        Schema::create('hoc_phans', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('don_vi_id')->nullable()->constrained('don_vis')->nullOnDelete();
            $table->string('ma_hoc_phan', 50)->unique();
            $table->string('ten_hoc_phan', 255);
            $table->unsignedSmallInteger('so_tin_chi');
            $table->enum('loai_hoc_phan', ['bat_buoc', 'tu_chon', 'co_so', 'chuyen_nganh', 'khac'])->default('khac');
            $table->text('mo_ta')->nullable();
            $table->boolean('trang_thai')->default(true);
            $table->timestamps();
        });

        Schema::create('nhom_hoc_phans', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('phien_ban_ctdt_id')->constrained('phien_ban_ctdts')->cascadeOnDelete();
            $table->string('ma_nhom', 50);
            $table->string('ten_nhom', 255);
            $table->unsignedSmallInteger('min_tin_chi')->default(0);
            $table->unsignedSmallInteger('min_so_mon')->default(0);
            $table->boolean('bat_buoc_toan_bo')->default(false);
            $table->unsignedSmallInteger('thu_tu')->default(0);
            $table->text('mo_ta')->nullable();
            $table->timestamps();

            $table->unique(['phien_ban_ctdt_id', 'ma_nhom']);
        });

        Schema::create('phien_ban_ctdt_hoc_phans', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('phien_ban_ctdt_id')->constrained('phien_ban_ctdts')->cascadeOnDelete();
            $table->foreignId('hoc_phan_id')->constrained('hoc_phans')->cascadeOnDelete();
            $table->foreignId('nhom_hoc_phan_id')->nullable()->constrained('nhom_hoc_phans')->nullOnDelete();
            $table->enum('vai_tro', ['bat_buoc', 'tu_chon'])->default('bat_buoc');
            $table->unsignedSmallInteger('hoc_ky_goi_y')->nullable();
            $table->enum('ap_dung_cho', ['all', 'major', 'specialization'])->default('all');
            $table->foreignId('chuyen_nganh_id')->nullable()->constrained('chuyen_nganhs')->nullOnDelete();
            $table->timestamps();

            $table->unique(['phien_ban_ctdt_id', 'hoc_phan_id', 'chuyen_nganh_id'], 'pb_ctdt_hoc_phan_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('phien_ban_ctdt_hoc_phans');
        Schema::dropIfExists('nhom_hoc_phans');
        Schema::dropIfExists('hoc_phans');
        Schema::dropIfExists('phien_ban_ctdts');
        Schema::dropIfExists('chuong_trinh_dao_taos');
        Schema::dropIfExists('khoa_tuyen_sinhs');
        Schema::dropIfExists('chuyen_nganhs');
    }
};
