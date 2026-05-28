<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('grade_weight_configs', function (Blueprint $table): void {
            $table->string('grade_mode', 20)->default('numeric')->after('final_weight');
        });

        DB::statement('ALTER TABLE student_grades ALTER COLUMN letter_grade TYPE VARCHAR(20)');
    }

    public function down(): void
    {
        Schema::table('grade_weight_configs', function (Blueprint $table): void {
            $table->dropColumn('grade_mode');
        });

        DB::statement('ALTER TABLE student_grades ALTER COLUMN letter_grade TYPE VARCHAR(5)');
    }
};
