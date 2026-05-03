<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hoc_phans', function (Blueprint $table): void {
            $table->unsignedSmallInteger('so_tiet_ly_thuyet')->nullable()->after('so_tin_chi');
            $table->unsignedSmallInteger('so_tiet_thuc_hanh')->nullable()->after('so_tiet_ly_thuyet');
        });
    }

    public function down(): void
    {
        Schema::table('hoc_phans', function (Blueprint $table): void {
            $table->dropColumn(['so_tiet_ly_thuyet', 'so_tiet_thuc_hanh']);
        });
    }
};
