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
        Schema::create('nam_hoc_hoc_kys', function (Blueprint $table): void {
            $table->id();
            $table->string('nam_hoc', 20);
            $table->string('hoc_ky', 10);

            $table->unique(['nam_hoc', 'hoc_ky']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('nam_hoc_hoc_kys');
    }
};
