<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const TON_GIAOS = [
        'Không',
        'Phật giáo',
        'Công giáo',
        'Tin lành',
        'Cao đài',
        'Phật giáo Hòa Hảo',
        'Hồi giáo',
        "Tôn giáo Baha'i",
        'Tịnh độ Cư sỹ Phật hội',
        'Cơ đốc Phục lâm',
        'Phật giáo Tứ Ân Hiếu nghĩa',
        'Minh Sư đạo',
        'Minh lý đạo - Tam Tông Miếu',
        'Bà-la-môn giáo',
        'Mặc môn',
        'Phật giáo Hiếu Nghĩa Tà Lơn',
        'Bửu Sơn Kỳ hương',
    ];

    public function up(): void
    {
        Schema::create('ton_giaos', function (Blueprint $table): void {
            $table->id();
            $table->string('ten_ton_giao', 100)->unique();
            $table->unsignedSmallInteger('thu_tu')->unique();
            $table->timestamps();
        });

        $now = now();

        DB::table('ton_giaos')->insert(
            collect(self::TON_GIAOS)
                ->map(fn (string $tenTonGiao, int $index): array => [
                    'ten_ton_giao' => $tenTonGiao,
                    'thu_tu' => $index + 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ])
                ->all()
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('ton_giaos');
    }
};
