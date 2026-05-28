<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hoc_phan_dang_ky_dot_dang_kys', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('hoc_ky_id')->constrained('hoc_kys')->cascadeOnDelete();
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->string('status', 20)->default('open');
            $table->timestamps();
            $table->index(['hoc_ky_id', 'status', 'starts_at', 'ends_at'], 'hpdk_period_term_status_idx');
        });

        Schema::create('lop_hoc_phan_dang_kys', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('hoc_ky_id')->constrained('hoc_kys')->cascadeOnDelete();
            $table->foreignId('lop_hoc_phan_id')->constrained('lop_hoc_phans')->cascadeOnDelete();
            $table->unsignedInteger('si_so_toi_da')->default(0);
            $table->string('status', 20)->default('open');
            $table->timestamps();
            $table->unique(['hoc_ky_id', 'lop_hoc_phan_id'], 'hpdk_class_term_unique');
            $table->index(['hoc_ky_id', 'status'], 'hpdk_class_term_status_idx');
        });

        Schema::create('dang_ky_hoc_phans', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('sinh_vien_id')->constrained('sinh_viens')->cascadeOnDelete();
            $table->foreignId('hoc_ky_id')->constrained('hoc_kys')->cascadeOnDelete();
            $table->foreignId('lop_hoc_phan_dang_ky_id')->constrained('lop_hoc_phan_dang_kys')->cascadeOnDelete();
            $table->foreignId('lop_hoc_phan_id')->constrained('lop_hoc_phans')->cascadeOnDelete();
            $table->string('ma_hoc_phan', 50);
            $table->string('status', 20)->default('registered');
            $table->timestamp('registered_at')->nullable();
            $table->timestamps();
            $table->unique(['sinh_vien_id', 'hoc_ky_id', 'ma_hoc_phan'], 'hpdk_student_course_unique');
            $table->index(['hoc_ky_id', 'lop_hoc_phan_dang_ky_id', 'status'], 'hpdk_registration_class_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dang_ky_hoc_phans');
        Schema::dropIfExists('lop_hoc_phan_dang_kys');
        Schema::dropIfExists('hoc_phan_dang_ky_dot_dang_kys');
    }
};
