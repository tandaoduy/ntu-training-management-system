<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sinh_viens', function (Blueprint $table): void {
            if (! Schema::hasColumn('sinh_viens', 'nam_nhap_hoc')) {
                $table->unsignedSmallInteger('nam_nhap_hoc')->nullable()->after('he_dao_tao');
            }

            if (! Schema::hasColumn('sinh_viens', 'khoa_hoc')) {
                $table->string('khoa_hoc', 20)->nullable()->after('nam_nhap_hoc');
            }
        });
    }

    public function down(): void
    {
        Schema::table('sinh_viens', function (Blueprint $table): void {
            $dropColumns = [];

            if (Schema::hasColumn('sinh_viens', 'khoa_hoc')) {
                $dropColumns[] = 'khoa_hoc';
            }

            if (Schema::hasColumn('sinh_viens', 'nam_nhap_hoc')) {
                $dropColumns[] = 'nam_nhap_hoc';
            }

            if ($dropColumns !== []) {
                $table->dropColumn($dropColumns);
            }
        });
    }
};
