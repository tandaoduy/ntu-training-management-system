<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('lops')) {
            return;
        }

        Schema::table('lops', function (Blueprint $table): void {
            if (! Schema::hasColumn('lops', 'lop_hoc_phan')) {
                $table->string('lop_hoc_phan', 255)->nullable()->after('don_vi_id');
            }

            if (! Schema::hasColumn('lops', 'si_so')) {
                $table->unsignedInteger('si_so')->default(0)->after('lop_hoc_phan');
            }

            if (! Schema::hasColumn('lops', 'mo_hinh_dao_tao')) {
                $table->string('mo_hinh_dao_tao', 50)->default('Tín chỉ')->after('si_so');
            }

            if (! Schema::hasColumn('lops', 'ma_khoi')) {
                $table->string('ma_khoi', 100)->nullable()->after('mo_hinh_dao_tao');
            }

            if (! Schema::hasColumn('lops', 'ten_khoi')) {
                $table->string('ten_khoi', 255)->nullable()->after('ma_khoi');
            }

            if (! Schema::hasColumn('lops', 'ma_don_vi')) {
                $table->string('ma_don_vi', 50)->nullable()->after('ten_khoi');
            }

            if (! Schema::hasColumn('lops', 'ten_don_vi')) {
                $table->string('ten_don_vi', 255)->nullable()->after('ma_don_vi');
            }
        });

        if (Schema::hasColumn('lops', 'ma_lop')) {
            DB::table('lops')
                ->leftJoin('don_vis', 'lops.don_vi_id', '=', 'don_vis.id')
                ->select([
                    'lops.id',
                    'lops.don_vi_id',
                    'lops.ma_lop',
                    'lops.ten_lop',
                    'don_vis.ma_don_vi',
                    'don_vis.ten_don_vi',
                ])
                ->orderBy('lops.id')
                ->get()
                ->each(function (object $lop): void {
                    $maKhoi = $lop->ma_lop ?: 'LOP-' . $lop->id;
                    $tenKhoi = $lop->ten_lop ?: $maKhoi;

                    DB::table('lops')
                        ->where('id', $lop->id)
                        ->update([
                            'lop_hoc_phan' => $maKhoi,
                            'si_so' => DB::table('sinh_viens')->where('lop_id', $lop->id)->count(),
                            'mo_hinh_dao_tao' => 'Tín chỉ',
                            'ma_khoi' => $maKhoi,
                            'ten_khoi' => $tenKhoi,
                            'ma_don_vi' => $lop->ma_don_vi,
                            'ten_don_vi' => $lop->ten_don_vi,
                        ]);
                });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('lops')) {
            return;
        }

        Schema::table('lops', function (Blueprint $table): void {
            foreach (['lop_hoc_phan', 'si_so', 'mo_hinh_dao_tao', 'ma_khoi', 'ten_khoi', 'ma_don_vi', 'ten_don_vi'] as $column) {
                if (Schema::hasColumn('lops', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
