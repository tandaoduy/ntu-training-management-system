<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grade_input_periods', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('hoc_ky_id')->constrained('hoc_kys')->cascadeOnDelete();
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->string('status', 20)->default('open');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['hoc_ky_id', 'status', 'starts_at', 'ends_at'], 'grade_period_term_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grade_input_periods');
    }
};
