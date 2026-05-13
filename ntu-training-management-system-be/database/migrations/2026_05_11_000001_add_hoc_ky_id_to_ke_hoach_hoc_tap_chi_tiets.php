<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ke_hoach_hoc_tap_chi_tiets', function (Blueprint $table): void {
            if (! Schema::hasColumn('ke_hoach_hoc_tap_chi_tiets', 'hoc_ky_id')) {
                $table->foreignId('hoc_ky_id')
                    ->nullable()
                    ->after('hoc_phan_id')
                    ->constrained('hoc_kys')
                    ->restrictOnDelete();
                $table->index('hoc_ky_id');
            }
        });

        if (Schema::hasColumn('ke_hoach_hoc_tap_chi_tiets', 'hoc_ky_id')) {
            DB::table('ke_hoach_hoc_tap_chi_tiets')
                ->whereNull('hoc_ky_id')
                ->orderBy('id')
                ->chunkById(200, function ($details): void {
                    $planTermIds = DB::table('ke_hoach_hoc_taps')
                        ->whereIn('id', $details->pluck('ke_hoach_hoc_tap_id')->unique())
                        ->pluck('hoc_ky_id', 'id');

                    foreach ($details as $detail) {
                        DB::table('ke_hoach_hoc_tap_chi_tiets')
                            ->where('id', $detail->id)
                            ->update(['hoc_ky_id' => $planTermIds[$detail->ke_hoach_hoc_tap_id] ?? null]);
                    }
                });
        }
    }

    public function down(): void
    {
        Schema::table('ke_hoach_hoc_tap_chi_tiets', function (Blueprint $table): void {
            if (Schema::hasColumn('ke_hoach_hoc_tap_chi_tiets', 'hoc_ky_id')) {
                $table->dropConstrainedForeignId('hoc_ky_id');
            }
        });
    }
};
