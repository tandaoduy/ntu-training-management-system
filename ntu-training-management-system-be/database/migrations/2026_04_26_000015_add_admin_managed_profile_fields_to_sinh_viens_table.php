<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sinh_viens', function (Blueprint $table): void {
            $table->string('noi_sinh', 255)->nullable()->after('ngay_sinh');
            $table->string('ten_don_vi', 255)->nullable()->after('don_vi_id');
            $table->string('ten_nganh_hoc', 255)->nullable()->after('nganh_dao_tao_id');
            $table->string('ho_khau_tinh_thanh_pho', 255)->nullable()->after('noi_cap_cccd');
            $table->string('ho_khau_quan_huyen', 255)->nullable()->after('ho_khau_tinh_thanh_pho');
            $table->string('que_quan_tinh_thanh_pho', 255)->nullable()->after('que_quan');
            $table->string('que_quan_quan_huyen', 255)->nullable()->after('que_quan_tinh_thanh_pho');
        });
    }

    public function down(): void
    {
        Schema::table('sinh_viens', function (Blueprint $table): void {
            $table->dropColumn([
                'noi_sinh',
                'ten_don_vi',
                'ten_nganh_hoc',
                'ho_khau_tinh_thanh_pho',
                'ho_khau_quan_huyen',
                'que_quan_tinh_thanh_pho',
                'que_quan_quan_huyen',
            ]);
        });
    }
};
