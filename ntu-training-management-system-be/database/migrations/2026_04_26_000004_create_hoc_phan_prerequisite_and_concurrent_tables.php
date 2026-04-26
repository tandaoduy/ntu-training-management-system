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
        Schema::create('hoc_phan_tien_quyets', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('hoc_phan_id')->constrained('hoc_phans')->cascadeOnDelete();
            $table->foreignId('hoc_phan_tien_quyet_id')->constrained('hoc_phans')->restrictOnDelete();
            $table->enum('loai', ['bat_buoc', 'tu_chon'])->default('bat_buoc');
            $table->string('ghi_chu', 500)->nullable();
            $table->timestamps();

            $table->unique(['hoc_phan_id', 'hoc_phan_tien_quyet_id'], 'hoc_phan_tien_quyet_unique');
            $table->index(['hoc_phan_id', 'loai']);
        });

        Schema::create('hoc_phan_song_hanhs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('hoc_phan_id')->constrained('hoc_phans')->cascadeOnDelete();
            $table->foreignId('hoc_phan_song_hanh_id')->constrained('hoc_phans')->restrictOnDelete();
            $table->string('ghi_chu', 500)->nullable();
            $table->timestamps();

            $table->unique(['hoc_phan_id', 'hoc_phan_song_hanh_id'], 'hoc_phan_song_hanh_unique');
            $table->index(['hoc_phan_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hoc_phan_song_hanhs');
        Schema::dropIfExists('hoc_phan_tien_quyets');
    }
};
