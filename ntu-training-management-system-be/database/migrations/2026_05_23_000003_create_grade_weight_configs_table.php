<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grade_weight_configs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('lop_hoc_phan_id')->constrained('lop_hoc_phans')->cascadeOnDelete();
            $table->foreignId('giang_vien_id')->nullable()->constrained('can_bos')->nullOnDelete();
            $table->decimal('attendance_weight', 5, 2)->default(10);
            $table->decimal('midterm_weight', 5, 2)->default(30);
            $table->decimal('final_weight', 5, 2)->default(60);
            $table->timestamps();

            $table->unique('lop_hoc_phan_id', 'grade_weight_class_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grade_weight_configs');
    }
};
