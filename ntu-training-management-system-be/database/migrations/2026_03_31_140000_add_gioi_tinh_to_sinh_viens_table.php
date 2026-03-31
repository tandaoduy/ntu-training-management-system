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
        if (Schema::hasTable('sinh_viens') && ! Schema::hasColumn('sinh_viens', 'gioi_tinh')) {
            Schema::table('sinh_viens', function (Blueprint $table) {
                $table->string('gioi_tinh', 20)->nullable()->after('ngay_sinh');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('sinh_viens') && Schema::hasColumn('sinh_viens', 'gioi_tinh')) {
            Schema::table('sinh_viens', function (Blueprint $table) {
                $table->dropColumn('gioi_tinh');
            });
        }
    }
};
