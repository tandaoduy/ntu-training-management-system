<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const DAN_TOCS = [
        'Kinh',
        'Tày',
        'Thái',
        'Mường',
        'Hoa',
        'Khơ-me',
        'Nùng',
        'HMông',
        'Dao',
        'Gia-rai',
        'Ê-đê',
        'Ba-na',
        'Sán Chay',
        'Chăm',
        'Xơ-đăng',
        'Sán Dìu',
        'Hrê',
        'Cơ-ho',
        'Ra-glai',
        'Mnông',
        'Thổ',
        'Xtiêng',
        'Khơmú',
        'Bru-Vân Kiều',
        'Giáy',
        'Cơ-tu',
        'Gié-Triêng',
        'Ta-ôi',
        'Mạ',
        'Co',
        'Chơ-ro',
        'Hà Nhì',
        'Xinh-mun',
        'Chu-ru',
        'Lào',
        'La-chí',
        'Phù Lá',
        'La Hủ',
        'Kháng',
        'Lự',
        'Pà Thẻn',
        'LôLô',
        'Chứt',
        'Mảng',
        'Cờ lao',
        'Bố Y',
        'La Ha',
        'Cống',
        'Ngái',
        'Si La',
        'Pu Péo',
        'Brâu',
        'Rơ-măm',
        'Ơ-đu',
    ];

    public function up(): void
    {
        Schema::create('dan_tocs', function (Blueprint $table): void {
            $table->id();
            $table->string('ten_dan_toc', 100)->unique();
            $table->unsignedSmallInteger('thu_tu')->unique();
            $table->timestamps();
        });

        $now = now();

        DB::table('dan_tocs')->insert(
            collect(self::DAN_TOCS)
                ->map(fn (string $tenDanToc, int $index): array => [
                    'ten_dan_toc' => $tenDanToc,
                    'thu_tu' => $index + 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ])
                ->all()
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('dan_tocs');
    }
};
