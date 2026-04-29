<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('sinh_viens') && ! Schema::hasColumn('sinh_viens', 'lop_id')) {
            Schema::table('sinh_viens', function (Blueprint $table): void {
                $table->foreignId('lop_id')
                    ->nullable()
                    ->after('ma_lop')
                    ->constrained('lops')
                    ->nullOnDelete();
            });
        }

        if (Schema::hasTable('lops')) {
            DB::table('lops')
                ->where('mo_hinh_dao_tao', 'Theo tín chỉ')
                ->update(['mo_hinh_dao_tao' => 'Tín chỉ']);
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('sinh_viens') && Schema::hasColumn('sinh_viens', 'lop_id')) {
            Schema::table('sinh_viens', function (Blueprint $table): void {
                $table->dropConstrainedForeignId('lop_id');
            });
        }
    }
};
