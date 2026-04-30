<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('nganh_dao_taos', function (Blueprint $table) {
            if (! Schema::hasColumn('nganh_dao_taos', 'thoi_gian_dao_tao')) {
                $table->decimal('thoi_gian_dao_tao', 3, 1)->default(4)->after('he_dao_tao');
            }
        });

        DB::table('nganh_dao_taos')
            ->where('ma_nganh', 'like', '%HV')
            ->orWhere('ma_nganh', 'like', '%MP')
            ->update(['thoi_gian_dao_tao' => 4.5]);
    }

    public function down(): void
    {
        Schema::table('nganh_dao_taos', function (Blueprint $table) {
            if (Schema::hasColumn('nganh_dao_taos', 'thoi_gian_dao_tao')) {
                $table->dropColumn('thoi_gian_dao_tao');
            }
        });
    }
};
