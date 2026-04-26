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
        Schema::create('nam_hocs', function (Blueprint $table): void {
            $table->id();
            $table->string('nam_hoc', 20)->unique();
            $table->timestamps();
        });

        Schema::create('hoc_kys', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('nam_hoc_id')->constrained('nam_hocs')->cascadeOnDelete();
            $table->string('hoc_ky', 10);
            $table->timestamps();

            $table->unique(['nam_hoc_id', 'hoc_ky']);
            $table->index(['nam_hoc_id']);
        });

        if (! Schema::hasTable('nam_hoc_hoc_kys')) {
            return;
        }

        $legacyTerms = DB::table('nam_hoc_hoc_kys')
            ->select(['nam_hoc', 'hoc_ky'])
            ->orderBy('id')
            ->get();

        foreach ($legacyTerms as $legacyTerm) {
            $namHocId = DB::table('nam_hocs')->where('nam_hoc', (string) $legacyTerm->nam_hoc)->value('id');

            if (! $namHocId) {
                $namHocId = DB::table('nam_hocs')->insertGetId([
                    'nam_hoc' => (string) $legacyTerm->nam_hoc,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            $exists = DB::table('hoc_kys')
                ->where('nam_hoc_id', $namHocId)
                ->where('hoc_ky', (string) $legacyTerm->hoc_ky)
                ->exists();

            if (! $exists) {
                DB::table('hoc_kys')->insert([
                    'nam_hoc_id' => $namHocId,
                    'hoc_ky' => (string) $legacyTerm->hoc_ky,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hoc_kys');
        Schema::dropIfExists('nam_hocs');
    }
};
