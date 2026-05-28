<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('student_grades') || Schema::hasColumn('student_grades', 'note')) {
            return;
        }

        Schema::table('student_grades', function (Blueprint $table): void {
            $table->string('note', 255)->nullable()->after('result');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('student_grades') || ! Schema::hasColumn('student_grades', 'note')) {
            return;
        }

        Schema::table('student_grades', function (Blueprint $table): void {
            $table->dropColumn('note');
        });
    }
};
