<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('lops')) {
            return;
        }

        foreach (['ma_lop', 'ten_lop', 'nam_hoc'] as $column) {
            if (Schema::hasColumn('lops', $column)) {
                $this->dropNotNullConstraint('lops', $column);
            }
        }

        if (Schema::hasColumn('lops', 'ma_lop') && Schema::hasColumn('lops', 'lop_hoc_phan')) {
            DB::table('lops')
                ->whereNull('lop_hoc_phan')
                ->update(['lop_hoc_phan' => DB::raw('ma_lop')]);
        }

        if (
            Schema::hasColumn('lops', 'ma_lop')
            && Schema::hasColumn('lops', 'ma_khoi')
            && Schema::hasColumn('lops', 'lop_hoc_phan')
        ) {
            DB::table('lops')
                ->whereNull('ma_lop')
                ->update(['ma_lop' => DB::raw('COALESCE(ma_khoi, lop_hoc_phan)')]);
        }
    }

    public function down(): void
    {
        // Legacy columns were relaxed to keep old databases compatible with the
        // normalized lops schema. Re-applying NOT NULL could break existing rows.
    }

    private function dropNotNullConstraint(string $table, string $column): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement(sprintf('ALTER TABLE "%s" ALTER COLUMN "%s" DROP NOT NULL', $table, $column));

            return;
        }

        if ($driver === 'mysql') {
            $type = match ($column) {
                'nam_hoc' => 'varchar(20)',
                default => 'varchar(100)',
            };

            DB::statement(sprintf('ALTER TABLE `%s` MODIFY `%s` %s NULL', $table, $column, $type));
        }
    }
};
