<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cau_hinh_tuan_hocs', function (Blueprint $table): void {
            if (! Schema::hasColumn('cau_hinh_tuan_hocs', 'tuan_nghis')) {
                $table->json('tuan_nghis')->nullable()->after('so_tuan_mac_dinh');
            }
        });
    }

    public function down(): void
    {
        Schema::table('cau_hinh_tuan_hocs', function (Blueprint $table): void {
            if (Schema::hasColumn('cau_hinh_tuan_hocs', 'tuan_nghis')) {
                $table->dropColumn('tuan_nghis');
            }
        });
    }
};
