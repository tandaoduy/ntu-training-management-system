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
        if (! Schema::hasTable('ket_qua_hoc_taps')) {
            return;
        }

        Schema::table('ket_qua_hoc_taps', function (Blueprint $table): void {
            $dropColumns = [];

            if (Schema::hasColumn('ket_qua_hoc_taps', 'nam_hoc')) {
                $dropColumns[] = 'nam_hoc';
            }

            if (Schema::hasColumn('ket_qua_hoc_taps', 'hoc_ky')) {
                $dropColumns[] = 'hoc_ky';
            }

            if ($dropColumns !== []) {
                $table->dropColumn($dropColumns);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('ket_qua_hoc_taps')) {
            return;
        }

        Schema::table('ket_qua_hoc_taps', function (Blueprint $table): void {
            if (! Schema::hasColumn('ket_qua_hoc_taps', 'nam_hoc')) {
                $table->string('nam_hoc', 20)->nullable()->after('hoc_ky_id');
            }

            if (! Schema::hasColumn('ket_qua_hoc_taps', 'hoc_ky')) {
                $table->string('hoc_ky', 20)->nullable()->after('nam_hoc');
            }
        });
    }
};
