<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_grades', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('dang_ky_hoc_phan_id')->constrained('dang_ky_hoc_phans')->cascadeOnDelete();
            $table->foreignId('sinh_vien_id')->constrained('sinh_viens')->cascadeOnDelete();
            $table->foreignId('hoc_ky_id')->constrained('hoc_kys')->cascadeOnDelete();
            $table->foreignId('lop_hoc_phan_id')->constrained('lop_hoc_phans')->cascadeOnDelete();
            $table->foreignId('lop_hoc_phan_dang_ky_id')->constrained('lop_hoc_phan_dang_kys')->cascadeOnDelete();
            $table->foreignId('giang_vien_id')->nullable()->constrained('can_bos')->nullOnDelete();
            $table->decimal('attendance_score', 4, 2)->nullable();
            $table->decimal('midterm_score', 4, 2)->nullable();
            $table->decimal('final_score', 4, 2)->nullable();
            $table->decimal('average_score', 4, 2)->nullable();
            $table->string('letter_grade', 5)->nullable();
            $table->decimal('grade_point', 3, 2)->nullable();
            $table->string('result', 20)->default('pending');
            $table->foreignId('graded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('graded_at')->nullable();
            $table->timestamp('locked_at')->nullable();
            $table->timestamps();

            $table->unique('dang_ky_hoc_phan_id', 'student_grades_registration_unique');
            $table->index(['hoc_ky_id', 'lop_hoc_phan_id'], 'student_grades_class_idx');
            $table->index(['sinh_vien_id', 'hoc_ky_id'], 'student_grades_student_term_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_grades');
    }
};
