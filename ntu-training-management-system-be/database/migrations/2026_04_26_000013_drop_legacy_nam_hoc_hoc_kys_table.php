<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('nam_hoc_hoc_kys')) {
            Schema::drop('nam_hoc_hoc_kys');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Legacy table is intentionally not recreated.
    }
};
