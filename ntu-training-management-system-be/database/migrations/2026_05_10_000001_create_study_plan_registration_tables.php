<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ke_hoach_hoc_tap_dot_dang_kys', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('current_hoc_ky_id')->constrained('hoc_kys')->restrictOnDelete();
            $table->foreignId('target_hoc_ky_id')->constrained('hoc_kys')->restrictOnDelete();
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->enum('status', ['draft', 'open', 'closed'])->default('open');
            $table->string('ghi_chu', 500)->nullable();
            $table->string('created_by', 100)->nullable();
            $table->timestamps();

            $table->index(['target_hoc_ky_id', 'status']);
            $table->index(['starts_at', 'ends_at']);
        });

        Schema::create('ke_hoach_hoc_taps', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('sinh_vien_id')->constrained('sinh_viens')->cascadeOnDelete();
            $table->foreignId('dot_dang_ky_id')->constrained('ke_hoach_hoc_tap_dot_dang_kys')->cascadeOnDelete();
            $table->foreignId('hoc_ky_id')->constrained('hoc_kys')->restrictOnDelete();
            $table->unsignedSmallInteger('tong_tin_chi')->default(0);
            $table->enum('status', ['draft', 'submitted', 'locked', 'cancelled'])->default('submitted');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            $table->unique(['sinh_vien_id', 'dot_dang_ky_id'], 'khht_student_period_unique');
            $table->index(['hoc_ky_id', 'status']);
        });

        Schema::create('ke_hoach_hoc_tap_chi_tiets', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('ke_hoach_hoc_tap_id')->constrained('ke_hoach_hoc_taps')->cascadeOnDelete();
            $table->foreignId('hoc_phan_id')->constrained('hoc_phans')->restrictOnDelete();
            $table->foreignId('hoc_ky_id')->nullable()->constrained('hoc_kys')->restrictOnDelete();
            $table->unsignedSmallInteger('so_tin_chi');
            $table->timestamps();

            $table->unique(['ke_hoach_hoc_tap_id', 'hoc_phan_id'], 'khht_detail_course_unique');
            $table->index('hoc_ky_id');
            $table->index('hoc_phan_id');
        });

        $khoaNgoaiNguId = DB::table('don_vis')->where('ma_don_vi', 'KNN')->value('id');
        $courses = [
            ['FLS310', 'Tiếng Anh A1', 4, 1],
            ['FLS312', 'Tiếng Anh A2.1', 4, 1],
            ['FLS313', 'Tiếng Anh A2.2', 4, 2],
        ];

        foreach ($courses as [$code, $name, $credits]) {
            DB::table('hoc_phans')->updateOrInsert(
                ['ma_hoc_phan' => $code],
                [
                    'don_vi_id' => $khoaNgoaiNguId,
                    'ten_hoc_phan' => $name,
                    'so_tin_chi' => $credits,
                    'loai_hoc_phan' => 'khac',
                    'mo_ta' => 'Học phần tiếng Anh bổ sung áp dụng cho mọi ngành.',
                    'trang_thai' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
        }

        $versions = DB::table('phien_ban_ctdts')->select('id')->get();
        foreach ($versions as $version) {
            DB::table('nhom_hoc_phans')->updateOrInsert(
                [
                    'phien_ban_ctdt_id' => $version->id,
                    'ma_nhom' => 'GDTC_NGOAINGU_BS',
                ],
                [
                    'ten_nhom' => 'Ngoại ngữ - học phần bổ sung',
                    'min_tin_chi' => 0,
                    'min_so_mon' => 0,
                    'bat_buoc_toan_bo' => false,
                    'thu_tu' => 4,
                    'mo_ta' => 'Các học phần tiếng Anh bổ sung để sinh viên học thêm theo chuẩn ngoại ngữ.',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );

            $groupId = DB::table('nhom_hoc_phans')
                ->where('phien_ban_ctdt_id', $version->id)
                ->where('ma_nhom', 'GDTC_NGOAINGU_BS')
                ->value('id');

            foreach ($courses as [$code, , , $recommendedSemester]) {
                $courseId = DB::table('hoc_phans')->where('ma_hoc_phan', $code)->value('id');

                DB::table('phien_ban_ctdt_hoc_phans')->updateOrInsert(
                    [
                        'phien_ban_ctdt_id' => $version->id,
                        'hoc_phan_id' => $courseId,
                        'chuyen_nganh_id' => null,
                    ],
                    [
                        'nhom_hoc_phan_id' => $groupId,
                        'vai_tro' => 'tu_chon',
                        'hoc_ky_goi_y' => $recommendedSemester,
                        'ap_dung_cho' => 'all',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                );
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('ke_hoach_hoc_tap_chi_tiets');
        Schema::dropIfExists('ke_hoach_hoc_taps');
        Schema::dropIfExists('ke_hoach_hoc_tap_dot_dang_kys');
    }
};
