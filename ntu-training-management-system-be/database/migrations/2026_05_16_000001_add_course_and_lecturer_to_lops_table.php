<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lops', function (Blueprint $table): void {
            if (! Schema::hasColumn('lops', 'ten_hoc_phan')) {
                $table->string('ten_hoc_phan', 255)->nullable()->after('lop_hoc_phan');
            }

            if (! Schema::hasColumn('lops', 'ten_giang_vien')) {
                $table->string('ten_giang_vien', 255)->nullable()->after('ten_hoc_phan');
            }
        });
    }

    public function down(): void
    {
        Schema::table('lops', function (Blueprint $table): void {
            if (Schema::hasColumn('lops', 'ten_giang_vien')) {
                $table->dropColumn('ten_giang_vien');
            }

            if (Schema::hasColumn('lops', 'ten_hoc_phan')) {
                $table->dropColumn('ten_hoc_phan');
            }
        });
    }
};
