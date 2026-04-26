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
        Schema::create('sinh_vien_chuong_trinhs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('sinh_vien_id')->constrained('sinh_viens')->cascadeOnDelete();
            $table->foreignId('phien_ban_ctdt_id')->constrained('phien_ban_ctdts')->restrictOnDelete();
            $table->date('ngay_ap_dung')->nullable();
            $table->boolean('locked')->default(false);
            $table->text('ghi_chu')->nullable();
            $table->timestamps();

            $table->unique(['sinh_vien_id', 'phien_ban_ctdt_id']);
            $table->index(['sinh_vien_id', 'locked']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sinh_vien_chuong_trinhs');
    }
};
