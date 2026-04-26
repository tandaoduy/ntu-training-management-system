<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('nam_hoc_hoc_kys')) {
            return;
        }

        DB::statement('DROP INDEX IF EXISTS hoc_ky_hien_hanh_nhap_diem_khoa_idx');

        Schema::table('nam_hoc_hoc_kys', function (Blueprint $table): void {
            $columnsToDrop = array_values(array_filter([
                Schema::hasColumn('nam_hoc_hoc_kys', 'ngay_bat_dau') ? 'ngay_bat_dau' : null,
                Schema::hasColumn('nam_hoc_hoc_kys', 'ngay_ket_thuc') ? 'ngay_ket_thuc' : null,
                Schema::hasColumn('nam_hoc_hoc_kys', 'trang_thai') ? 'trang_thai' : null,
                Schema::hasColumn('nam_hoc_hoc_kys', 'hien_hanh') ? 'hien_hanh' : null,
                Schema::hasColumn('nam_hoc_hoc_kys', 'ghi_chu') ? 'ghi_chu' : null,
                Schema::hasColumn('nam_hoc_hoc_kys', 'hien_thi_tu') ? 'hien_thi_tu' : null,
                Schema::hasColumn('nam_hoc_hoc_kys', 'hien_thi_den') ? 'hien_thi_den' : null,
                Schema::hasColumn('nam_hoc_hoc_kys', 'ke_hoach_hoc_tap_mo_tu') ? 'ke_hoach_hoc_tap_mo_tu' : null,
                Schema::hasColumn('nam_hoc_hoc_kys', 'ke_hoach_hoc_tap_mo_den') ? 'ke_hoach_hoc_tap_mo_den' : null,
                Schema::hasColumn('nam_hoc_hoc_kys', 'dang_ky_hoc_phan_mo_tu') ? 'dang_ky_hoc_phan_mo_tu' : null,
                Schema::hasColumn('nam_hoc_hoc_kys', 'dang_ky_hoc_phan_mo_den') ? 'dang_ky_hoc_phan_mo_den' : null,
                Schema::hasColumn('nam_hoc_hoc_kys', 'nhap_diem_mo_tu') ? 'nhap_diem_mo_tu' : null,
                Schema::hasColumn('nam_hoc_hoc_kys', 'nhap_diem_mo_den') ? 'nhap_diem_mo_den' : null,
                Schema::hasColumn('nam_hoc_hoc_kys', 'nhap_diem_bi_khoa') ? 'nhap_diem_bi_khoa' : null,
                Schema::hasColumn('nam_hoc_hoc_kys', 'created_at') ? 'created_at' : null,
                Schema::hasColumn('nam_hoc_hoc_kys', 'updated_at') ? 'updated_at' : null,
            ]));

            if ($columnsToDrop !== []) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('nam_hoc_hoc_kys')) {
            return;
        }

        Schema::table('nam_hoc_hoc_kys', function (Blueprint $table): void {
            if (! Schema::hasColumn('nam_hoc_hoc_kys', 'created_at') && ! Schema::hasColumn('nam_hoc_hoc_kys', 'updated_at')) {
                $table->timestamps();
            }

            if (! Schema::hasColumn('nam_hoc_hoc_kys', 'ngay_bat_dau')) {
                $table->date('ngay_bat_dau')->nullable();
            }

            if (! Schema::hasColumn('nam_hoc_hoc_kys', 'ngay_ket_thuc')) {
                $table->date('ngay_ket_thuc')->nullable();
            }

            if (! Schema::hasColumn('nam_hoc_hoc_kys', 'trang_thai')) {
                $table->string('trang_thai', 255)->default('sap_dien_ra');
            }

            if (! Schema::hasColumn('nam_hoc_hoc_kys', 'hien_hanh')) {
                $table->boolean('hien_hanh')->default(false);
            }

            if (! Schema::hasColumn('nam_hoc_hoc_kys', 'ghi_chu')) {
                $table->text('ghi_chu')->nullable();
            }
        });
    }
};
