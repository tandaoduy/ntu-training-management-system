<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('lops')) {
            return;
        }

        try {
            Schema::table('lops', function (Blueprint $table): void {
                $table->dropUnique('lops_don_vi_id_ma_lop_unique');
            });
        } catch (\Throwable) {
            // The index may not exist on fresh databases or after manual cleanup.
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('lops') || ! Schema::hasColumn('lops', 'ma_lop')) {
            return;
        }

        Schema::table('lops', function (Blueprint $table): void {
            $table->unique(['don_vi_id', 'ma_lop']);
        });
    }
};
