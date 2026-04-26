<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('nam_hoc_hoc_kys')) {
            return;
        }

        DB::statement("ALTER TABLE nam_hoc_hoc_kys ALTER COLUMN hoc_ky TYPE VARCHAR(10) USING hoc_ky::text");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('nam_hoc_hoc_kys')) {
            return;
        }

        Schema::table('nam_hoc_hoc_kys', function (Blueprint $table): void {
            $table->dropUnique('nam_hoc_hoc_kys_nam_hoc_hoc_ky_unique');
        });

        DB::statement("ALTER TABLE nam_hoc_hoc_kys ALTER COLUMN hoc_ky TYPE SMALLINT USING CASE WHEN hoc_ky = 'Hè' THEN 3 ELSE hoc_ky::smallint END");

        Schema::table('nam_hoc_hoc_kys', function (Blueprint $table): void {
            $table->unique(['nam_hoc', 'hoc_ky']);
        });
    }
};
