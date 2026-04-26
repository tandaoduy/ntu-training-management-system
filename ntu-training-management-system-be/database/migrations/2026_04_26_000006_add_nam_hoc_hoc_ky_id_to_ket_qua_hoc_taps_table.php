<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('ket_qua_hoc_taps', function (Blueprint $table): void {
            $table->foreignId('nam_hoc_hoc_ky_id')
                ->nullable()
                ->after('lan_hoc')
                ->constrained('nam_hoc_hoc_kys')
                ->nullOnDelete();

            $table->index(['sinh_vien_id', 'nam_hoc_hoc_ky_id'], 'ket_qua_hoc_tap_sinh_vien_hoc_ky_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ket_qua_hoc_taps', function (Blueprint $table): void {
            $table->dropIndex('ket_qua_hoc_tap_sinh_vien_hoc_ky_idx');
            $table->dropConstrainedForeignId('nam_hoc_hoc_ky_id');
        });
    }
};
