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
                $table->dropUnique('lops_don_vi_id_ma_khoi_unique');
            });
        } catch (\Throwable) {
            // Fresh databases created after the earlier migration was changed only have a normal index.
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('lops')) {
            return;
        }

        Schema::table('lops', function (Blueprint $table): void {
            $table->unique(['don_vi_id', 'ma_khoi']);
        });
    }
};
