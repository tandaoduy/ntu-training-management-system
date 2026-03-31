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
        if (Schema::hasTable('students')) {
            Schema::drop('students');
        }

        Schema::create('don_vis', function (Blueprint $table) {
            $table->id();
            $table->string('ma_don_vi', 50)->unique();
            $table->string('ten_don_vi', 255);
            $table->enum('loai_don_vi', ['Đào tạo', 'Quản lý']);
            $table->timestamps();
        });

        Schema::create('nganh_dao_taos', function (Blueprint $table) {
            $table->id();
            $table->string('ma_nganh', 50)->unique();
            $table->string('ten_nganh', 255);
            $table->foreignId('don_vi_id')->nullable()->constrained('don_vis')->nullOnDelete();
            $table->enum('he_dao_tao', ['Chính quy', 'Vừa học vừa làm', 'Đào tạo từ xa']);
            $table->timestamps();
        });

        Schema::create('sinh_viens', function (Blueprint $table) {
            $table->id();
            $table->string('user_id', 50)->unique();
            $table->string('anh', 500)->nullable();
            $table->string('ten_sinh_vien', 255);
            $table->date('ngay_sinh')->nullable();
            $table->string('gioi_tinh', 20)->nullable();
            $table->string('email', 255)->nullable();
            $table->string('so_dien_thoai', 20)->nullable();
            $table->string('ma_lop', 100)->nullable();
            $table->foreignId('nganh_dao_tao_id')->nullable()->constrained('nganh_dao_taos')->nullOnDelete();
            $table->foreignId('don_vi_id')->nullable()->constrained('don_vis')->nullOnDelete();
            $table->enum('he_dao_tao', ['Chính quy', 'Vừa học vừa làm', 'Đào tạo từ xa'])->nullable();
            $table->string('so_cccd', 20)->nullable();
            $table->date('ngay_cap_cccd')->nullable();
            $table->string('noi_cap_cccd', 255)->nullable();
            $table->string('que_quan', 255)->nullable();
            $table->string('dan_toc', 100)->nullable();
            $table->string('ton_giao', 100)->nullable();
            $table->text('dia_chi_lien_lac')->nullable();
            $table->string('so_dien_thoai_gia_dinh', 20)->nullable();
            $table->string('ho_ten_cha', 255)->nullable();
            $table->string('ho_ten_me', 255)->nullable();
            $table->date('ngay_sinh_cha')->nullable();
            $table->date('ngay_sinh_me')->nullable();
            $table->string('que_quan_cha', 255)->nullable();
            $table->string('que_quan_me', 255)->nullable();
            $table->string('nghe_nghiep_cha', 255)->nullable();
            $table->string('nghe_nghiep_me', 255)->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('username')->on('users')->cascadeOnDelete();
        });

        Schema::create('can_bos', function (Blueprint $table) {
            $table->id();
            $table->string('user_id', 50)->unique();
            $table->string('ten_giang_vien', 255);
            $table->date('ngay_sinh')->nullable();
            $table->string('que_quan', 255)->nullable();
            $table->foreignId('don_vi_id')->nullable()->constrained('don_vis')->nullOnDelete();
            $table->text('dia_chi')->nullable();
            $table->string('so_dien_thoai', 20)->nullable();
            $table->string('chuc_vu', 255)->nullable();
            $table->string('chuc_danh', 255)->nullable();
            $table->string('email', 255)->nullable();
            $table->string('gioi_tinh', 20)->nullable();
            $table->string('ton_giao', 100)->nullable();
            $table->string('dan_toc', 100)->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('username')->on('users')->cascadeOnDelete();
        });

        Schema::create('chuyen_viens', function (Blueprint $table) {
            $table->id();
            $table->string('user_id', 50)->unique();
            $table->string('ten_chuyen_vien', 255);
            $table->string('email', 255)->nullable();
            $table->string('chuc_vu', 255)->nullable();
            $table->string('que_quan', 255)->nullable();
            $table->date('ngay_sinh')->nullable();
            $table->string('so_dien_thoai', 20)->nullable();
            $table->string('gioi_tinh', 20)->nullable();
            $table->foreignId('don_vi_id')->nullable()->constrained('don_vis')->nullOnDelete();
            $table->string('ton_giao', 100)->nullable();
            $table->string('dan_toc', 100)->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('username')->on('users')->cascadeOnDelete();
        });

        Schema::create('quan_lys', function (Blueprint $table) {
            $table->id();
            $table->string('user_id', 50)->unique();
            $table->string('ten_nguoi_quan_ly', 255);
            $table->string('email', 255)->nullable();
            $table->string('chuc_vu', 255)->nullable();
            $table->string('que_quan', 255)->nullable();
            $table->date('ngay_sinh')->nullable();
            $table->string('so_dien_thoai', 20)->nullable();
            $table->string('ton_giao', 100)->nullable();
            $table->string('dan_toc', 100)->nullable();
            $table->foreignId('don_vi_id')->nullable()->constrained('don_vis')->nullOnDelete();
            $table->timestamps();

            $table->foreign('user_id')->references('username')->on('users')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quan_lys');
        Schema::dropIfExists('chuyen_viens');
        Schema::dropIfExists('can_bos');
        Schema::dropIfExists('sinh_viens');
        Schema::dropIfExists('nganh_dao_taos');
        Schema::dropIfExists('don_vis');

        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('student_code', 20)->unique();
            $table->string('full_name', 255);
            $table->date('date_of_birth')->nullable();
            $table->string('gender', 10)->nullable();
            $table->string('class_name', 50)->nullable();
            $table->string('major_name', 255)->nullable();
            $table->string('email', 255)->nullable();
            $table->string('phone', 15)->nullable();
            $table->text('address')->nullable();
            $table->string('avatar', 500)->nullable();
            $table->boolean('status')->default(true);
            $table->timestamps();
        });
    }
};
