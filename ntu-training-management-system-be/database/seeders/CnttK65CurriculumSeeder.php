<?php

namespace Database\Seeders;

use App\Models\DonVi;
use App\Models\NganhDaoTao;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CnttK65CurriculumSeeder extends Seeder
{
    public function run(): void
    {
        $cntt = NganhDaoTao::query()->where('ma_nganh', '7480201')->first();
        $khoaCntt = DonVi::query()->where('ma_don_vi', 'KCNTT')->first();
        $khoaKhxhNv = DonVi::query()->where('ma_don_vi', 'KKHXHNV')->first();
        $khoaNgoaiNgu = DonVi::query()->where('ma_don_vi', 'KNN')->first();
        $truongKinhTeKinhDoanh = DonVi::query()->where('ma_don_vi', 'TKTKD')->first();
        $truongKyThuatCongNghe = DonVi::query()->where('ma_don_vi', 'TKTCN')->first();
        $trungTamTheDucTheThao = DonVi::query()->where('ma_don_vi', 'TTDTT')->first();
        $trungTamGdqpAn = DonVi::query()->where('ma_don_vi', 'TTGDQPAN')->first();

        if (! $cntt || ! $khoaCntt) {
            $this->command->warn('Không tìm thấy ngành CNTT hoặc Khoa CNTT. Hãy chạy DonViSeeder và NganhDaoTaoSeeder trước.');

            return;
        }

        DB::table('khoa_tuyen_sinhs')->updateOrInsert(
            ['ma_khoa' => 'K65'],
            [
                'nam_bat_dau' => 2023,
                'nam_ket_thuc' => 2027,
                'mo_ta' => 'Khóa tuyển sinh 65',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        $khoaTuyenSinhId = DB::table('khoa_tuyen_sinhs')->where('ma_khoa', 'K65')->value('id');

        DB::table('chuong_trinh_dao_taos')->updateOrInsert(
            ['ma_ctdt' => 'CNTT'],
            [
                'ten_ctdt' => 'Chương trình đào tạo Công nghệ thông tin',
                'nganh_dao_tao_id' => $cntt->id,
                'chuyen_nganh_id' => null,
                'khoa_tuyen_sinh_id' => $khoaTuyenSinhId,
                'tong_tin_chi_yeu_cau' => 144,
                'mo_ta' => 'Chương trình đào tạo ngành Công nghệ thông tin.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        $ctdtId = DB::table('chuong_trinh_dao_taos')->where('ma_ctdt', 'CNTT')->value('id');

        DB::table('phien_ban_ctdts')->updateOrInsert(
            [
                'chuong_trinh_dao_tao_id' => $ctdtId,
                'version_no' => 1,
            ],
            [
                'hieu_luc_tu' => '2023-09-01',
                'hieu_luc_den' => null,
                'trang_thai' => 'published',
                'ghi_chu' => 'Phiên bản CTĐT đang áp dụng cho sinh viên K65.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        $phienBanId = DB::table('phien_ban_ctdts')
            ->where('chuong_trinh_dao_tao_id', $ctdtId)
            ->where('version_no', 1)
            ->value('id');

        DB::table('sinh_viens')
            ->where('ma_lop', 'like', '65.CNTT%')
            ->select(['id'])
            ->orderBy('id')
            ->get()
            ->each(function (object $sinhVien) use ($phienBanId): void {
                DB::table('sinh_vien_chuong_trinhs')->updateOrInsert(
                    [
                        'sinh_vien_id' => $sinhVien->id,
                        'phien_ban_ctdt_id' => $phienBanId,
                    ],
                    [
                        'ngay_ap_dung' => '2023-09-01',
                        'locked' => true,
                        'ghi_chu' => 'Tự động gán CTĐT CNTT cho sinh viên K65.',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                );
            });

        $specializations = [
            'CNPM' => 'Công nghệ phần mềm',
            'HTTT' => 'Hệ thống thông tin',
            'TTMMT' => 'Truyền thông và Mạng máy tính',
        ];

        foreach ($specializations as $maChuyenNganh => $tenChuyenNganh) {
            DB::table('chuyen_nganhs')->updateOrInsert(
                ['ma_chuyen_nganh' => $maChuyenNganh],
                [
                    'nganh_dao_tao_id' => $cntt->id,
                    'ten_chuyen_nganh' => $tenChuyenNganh,
                    'mo_ta' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
        }

        $chuyenNganhIds = DB::table('chuyen_nganhs')
            ->whereIn('ma_chuyen_nganh', array_keys($specializations))
            ->pluck('id', 'ma_chuyen_nganh');

        DB::table('nhom_hoc_phans')->updateOrInsert(
            [
                'phien_ban_ctdt_id' => $phienBanId,
                'ma_nhom' => 'GDTC_XHNVNT_BB',
            ],
            [
                'ten_nhom' => 'Xã hội, Nhân văn và Nghệ thuật - học phần bắt buộc',
                'min_tin_chi' => 18,
                'min_so_mon' => 8,
                'bat_buoc_toan_bo' => true,
                'thu_tu' => 1,
                'mo_ta' => 'Các học phần bắt buộc thuộc khối giáo dục tổng quát.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        $nhomId = DB::table('nhom_hoc_phans')
            ->where('phien_ban_ctdt_id', $phienBanId)
            ->where('ma_nhom', 'GDTC_XHNVNT_BB')
            ->value('id');

        DB::table('nhom_hoc_phans')->updateOrInsert(
            [
                'phien_ban_ctdt_id' => $phienBanId,
                'ma_nhom' => 'GDTC_XHNVNT_TC',
            ],
            [
                'ten_nhom' => 'Xã hội, Nhân văn và Nghệ thuật - học phần tự chọn',
                'min_tin_chi' => 2,
                'min_so_mon' => 1,
                'bat_buoc_toan_bo' => false,
                'thu_tu' => 2,
                'mo_ta' => 'Các học phần tự chọn thuộc khối giáo dục tổng quát.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        $nhomTuChonId = DB::table('nhom_hoc_phans')
            ->where('phien_ban_ctdt_id', $phienBanId)
            ->where('ma_nhom', 'GDTC_XHNVNT_TC')
            ->value('id');

        DB::table('nhom_hoc_phans')->updateOrInsert(
            [
                'phien_ban_ctdt_id' => $phienBanId,
                'ma_nhom' => 'GDTC_TOANTINTN_CNMT_BB',
            ],
            [
                'ten_nhom' => 'Toán, Tin học, Tự nhiên, CN&MT - học phần bắt buộc',
                'min_tin_chi' => 15,
                'min_so_mon' => 6,
                'bat_buoc_toan_bo' => true,
                'thu_tu' => 3,
                'mo_ta' => 'Các học phần bắt buộc thuộc khối Toán, Tin học, Tự nhiên, Công nghệ và Môi trường.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        $nhomToanTinTuNhienId = DB::table('nhom_hoc_phans')
            ->where('phien_ban_ctdt_id', $phienBanId)
            ->where('ma_nhom', 'GDTC_TOANTINTN_CNMT_BB')
            ->value('id');

        DB::table('nhom_hoc_phans')->updateOrInsert(
            [
                'phien_ban_ctdt_id' => $phienBanId,
                'ma_nhom' => 'GDTC_NGOAINGU_BB',
            ],
            [
                'ten_nhom' => 'Ngoại ngữ - học phần bắt buộc',
                'min_tin_chi' => 8,
                'min_so_mon' => 2,
                'bat_buoc_toan_bo' => true,
                'thu_tu' => 4,
                'mo_ta' => 'Các học phần ngoại ngữ bắt buộc, tạm lưu theo mức B1.1 và B1.2.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        $nhomNgoaiNguId = DB::table('nhom_hoc_phans')
            ->where('phien_ban_ctdt_id', $phienBanId)
            ->where('ma_nhom', 'GDTC_NGOAINGU_BB')
            ->value('id');

        DB::table('nhom_hoc_phans')->updateOrInsert(
            [
                'phien_ban_ctdt_id' => $phienBanId,
                'ma_nhom' => 'GDTC_TCQPAN_BB',
            ],
            [
                'ten_nhom' => 'Thể chất và Quốc phòng - An ninh - học phần bắt buộc',
                'min_tin_chi' => 9,
                'min_so_mon' => 5,
                'bat_buoc_toan_bo' => true,
                'thu_tu' => 5,
                'mo_ta' => 'Các học phần bắt buộc thuộc khối Thể chất và Quốc phòng - An ninh.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        $nhomTheChatQuocPhongBatBuocId = DB::table('nhom_hoc_phans')
            ->where('phien_ban_ctdt_id', $phienBanId)
            ->where('ma_nhom', 'GDTC_TCQPAN_BB')
            ->value('id');

        DB::table('nhom_hoc_phans')->updateOrInsert(
            [
                'phien_ban_ctdt_id' => $phienBanId,
                'ma_nhom' => 'GDTC_THECHAT_TC',
            ],
            [
                'ten_nhom' => 'Thể chất - học phần tự chọn',
                'min_tin_chi' => 2,
                'min_so_mon' => 2,
                'bat_buoc_toan_bo' => false,
                'thu_tu' => 6,
                'mo_ta' => 'Sinh viên chọn các học phần thể chất theo học kỳ khuyến nghị.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        $nhomTheChatTuChonId = DB::table('nhom_hoc_phans')
            ->where('phien_ban_ctdt_id', $phienBanId)
            ->where('ma_nhom', 'GDTC_THECHAT_TC')
            ->value('id');

        DB::table('nhom_hoc_phans')->updateOrInsert(
            [
                'phien_ban_ctdt_id' => $phienBanId,
                'ma_nhom' => 'GDCN_COSONGANH_BB',
            ],
            [
                'ten_nhom' => 'Cơ sở ngành - học phần bắt buộc',
                'min_tin_chi' => 34,
                'min_so_mon' => 12,
                'bat_buoc_toan_bo' => true,
                'thu_tu' => 7,
                'mo_ta' => 'Các học phần bắt buộc thuộc khối cơ sở ngành.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        $nhomCoSoNganhBatBuocId = DB::table('nhom_hoc_phans')
            ->where('phien_ban_ctdt_id', $phienBanId)
            ->where('ma_nhom', 'GDCN_COSONGANH_BB')
            ->value('id');

        DB::table('nhom_hoc_phans')->updateOrInsert(
            [
                'phien_ban_ctdt_id' => $phienBanId,
                'ma_nhom' => 'GDCN_COSONGANH_TC',
            ],
            [
                'ten_nhom' => 'Cơ sở ngành - học phần tự chọn',
                'min_tin_chi' => 3,
                'min_so_mon' => 1,
                'bat_buoc_toan_bo' => false,
                'thu_tu' => 8,
                'mo_ta' => 'Sinh viên chọn học phần tự chọn thuộc khối cơ sở ngành.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        $nhomCoSoNganhTuChonId = DB::table('nhom_hoc_phans')
            ->where('phien_ban_ctdt_id', $phienBanId)
            ->where('ma_nhom', 'GDCN_COSONGANH_TC')
            ->value('id');

        $industryGroups = [
            'GDCN_NGANH_CHUNG_BB' => ['Ngành - học phần bắt buộc chung', 13, 4, true, 9],
            'GDCN_CNPM_BB' => ['Nhóm Chuyên ngành Công nghệ phần mềm - học phần bắt buộc', 21, 7, true, 10],
            'GDCN_HTTT_BB' => ['Nhóm Chuyên ngành Hệ thống thông tin - học phần bắt buộc', 21, 7, true, 11],
            'GDCN_TTMMT_BB' => ['Nhóm Chuyên ngành Truyền thông và Mạng máy tính - học phần bắt buộc', 21, 7, true, 12],
            'GDCN_CNPM_TC' => ['Nhóm Chuyên ngành Công nghệ phần mềm - học phần tự chọn', 9, 3, false, 13],
            'GDCN_HTTT_TC' => ['Nhóm Chuyên ngành Hệ thống thông tin - học phần tự chọn', 9, 3, false, 14],
            'GDCN_TTMMT_TC' => ['Nhóm Chuyên ngành Truyền thông và Mạng máy tính - học phần tự chọn', 9, 3, false, 15],
            'GDCN_TOTNGHIEP_CHUNG' => ['Tốt nghiệp - đồ án/khóa luận hoặc học phần thay thế chung', 10, 1, false, 16],
            'GDCN_TOTNGHIEP_CNPM' => ['Tốt nghiệp - học phần thay thế chuyên ngành Công nghệ phần mềm', 5, 2, false, 17],
            'GDCN_TOTNGHIEP_HTTT' => ['Tốt nghiệp - học phần thay thế chuyên ngành Hệ thống thông tin', 5, 2, false, 18],
            'GDCN_TOTNGHIEP_TTMMT' => ['Tốt nghiệp - học phần thay thế chuyên ngành Truyền thông và Mạng máy tính', 5, 2, false, 19],
        ];

        foreach ($industryGroups as $maNhom => [$tenNhom, $minTinChi, $minSoMon, $batBuocToanBo, $thuTu]) {
            DB::table('nhom_hoc_phans')->updateOrInsert(
                [
                    'phien_ban_ctdt_id' => $phienBanId,
                    'ma_nhom' => $maNhom,
                ],
                [
                    'ten_nhom' => $tenNhom,
                    'min_tin_chi' => $minTinChi,
                    'min_so_mon' => $minSoMon,
                    'bat_buoc_toan_bo' => $batBuocToanBo,
                    'thu_tu' => $thuTu,
                    'mo_ta' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
        }

        $industryGroupIds = DB::table('nhom_hoc_phans')
            ->where('phien_ban_ctdt_id', $phienBanId)
            ->whereIn('ma_nhom', array_keys($industryGroups))
            ->pluck('id', 'ma_nhom');

        $courses = [
            ['POL307', 'Triết học Mác - Lênin', 3, 1],
            ['POL309', 'Kinh tế chính trị Mác - Lênin', 2, 2],
            ['POL308', 'Chủ nghĩa xã hội khoa học', 2, 3],
            ['POL333', 'Tư tưởng Hồ Chí Minh', 2, 5],
            ['POL310', 'Lịch sử Đảng Cộng sản Việt Nam', 2, 4],
            ['SSH313', 'Pháp luật đại cương', 2, 1],
            ['SSH378', 'Tư duy phản biện', 3, 2],
            ['SSH379', 'Ngôn ngữ học thuật', 2, 3],
        ];

        foreach ($courses as [$maHocPhan, $tenHocPhan, $soTinChi, $hocKyGoiY]) {
            DB::table('hoc_phans')->updateOrInsert(
                ['ma_hoc_phan' => $maHocPhan],
                [
                    'don_vi_id' => $khoaKhxhNv?->id,
                    'ten_hoc_phan' => $tenHocPhan,
                    'so_tin_chi' => $soTinChi,
                    'loai_hoc_phan' => 'khac',
                    'mo_ta' => null,
                    'trang_thai' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );

            $hocPhanId = DB::table('hoc_phans')->where('ma_hoc_phan', $maHocPhan)->value('id');

            DB::table('phien_ban_ctdt_hoc_phans')->updateOrInsert(
                [
                    'phien_ban_ctdt_id' => $phienBanId,
                    'hoc_phan_id' => $hocPhanId,
                    'chuyen_nganh_id' => null,
                ],
                [
                    'nhom_hoc_phan_id' => $nhomId,
                    'vai_tro' => 'bat_buoc',
                    'hoc_ky_goi_y' => $hocKyGoiY,
                    'ap_dung_cho' => 'all',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
        }

        $optionalCourses = [
            ['SSH381', 'Thưởng thức mỹ thuật', 2, 3, $khoaKhxhNv?->id],
            ['BUA319', 'Nhập môn Quản trị học', 2, 3, $truongKinhTeKinhDoanh?->id],
            ['MKT372', 'Nhập môn Marketing', 2, 3, $truongKinhTeKinhDoanh?->id],
        ];

        foreach ($optionalCourses as [$maHocPhan, $tenHocPhan, $soTinChi, $hocKyGoiY, $donViId]) {
            DB::table('hoc_phans')->updateOrInsert(
                ['ma_hoc_phan' => $maHocPhan],
                [
                    'don_vi_id' => $donViId,
                    'ten_hoc_phan' => $tenHocPhan,
                    'so_tin_chi' => $soTinChi,
                    'loai_hoc_phan' => 'khac',
                    'mo_ta' => null,
                    'trang_thai' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );

            $hocPhanId = DB::table('hoc_phans')->where('ma_hoc_phan', $maHocPhan)->value('id');

            DB::table('phien_ban_ctdt_hoc_phans')->updateOrInsert(
                [
                    'phien_ban_ctdt_id' => $phienBanId,
                    'hoc_phan_id' => $hocPhanId,
                    'chuyen_nganh_id' => null,
                ],
                [
                    'nhom_hoc_phan_id' => $nhomTuChonId,
                    'vai_tro' => 'tu_chon',
                    'hoc_ky_goi_y' => $hocKyGoiY,
                    'ap_dung_cho' => 'all',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
        }

        $mathScienceCourses = [
            ['MAT327', 'Toán 1', 3, 1, $truongKyThuatCongNghe?->id],
            ['MAT328', 'Toán 2', 2, 2, $truongKyThuatCongNghe?->id],
            ['MAT322', 'Xác suất - Thống kê', 3, 4, $truongKyThuatCongNghe?->id],
            ['SOT381', 'Tin học đại cương A (LT+TH)', 3, 1, $khoaCntt?->id],
            ['PHY310', 'Vật lý đại cương 1', 3, 3, $truongKyThuatCongNghe?->id],
            ['PHY311', 'T.Hành Vật lý đại cương 1', 1, 3, $truongKyThuatCongNghe?->id],
        ];

        foreach ($mathScienceCourses as [$maHocPhan, $tenHocPhan, $soTinChi, $hocKyGoiY, $donViId]) {
            DB::table('hoc_phans')->updateOrInsert(
                ['ma_hoc_phan' => $maHocPhan],
                [
                    'don_vi_id' => $donViId,
                    'ten_hoc_phan' => $tenHocPhan,
                    'so_tin_chi' => $soTinChi,
                    'loai_hoc_phan' => 'co_so',
                    'mo_ta' => null,
                    'trang_thai' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );

            $hocPhanId = DB::table('hoc_phans')->where('ma_hoc_phan', $maHocPhan)->value('id');

            DB::table('phien_ban_ctdt_hoc_phans')->updateOrInsert(
                [
                    'phien_ban_ctdt_id' => $phienBanId,
                    'hoc_phan_id' => $hocPhanId,
                    'chuyen_nganh_id' => null,
                ],
                [
                    'nhom_hoc_phan_id' => $nhomToanTinTuNhienId,
                    'vai_tro' => 'bat_buoc',
                    'hoc_ky_goi_y' => $hocKyGoiY,
                    'ap_dung_cho' => 'all',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
        }

        $foreignLanguageCourses = [
            ['FLS314', 'Tiếng Anh B1.1', 4, 1],
            ['FLS315', 'Tiếng Anh B1.2', 4, 2],
        ];

        foreach ($foreignLanguageCourses as [$maHocPhan, $tenHocPhan, $soTinChi, $hocKyGoiY]) {
            DB::table('hoc_phans')->updateOrInsert(
                ['ma_hoc_phan' => $maHocPhan],
                [
                    'don_vi_id' => $khoaNgoaiNgu?->id,
                    'ten_hoc_phan' => $tenHocPhan,
                    'so_tin_chi' => $soTinChi,
                    'loai_hoc_phan' => 'khac',
                    'mo_ta' => null,
                    'trang_thai' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );

            $hocPhanId = DB::table('hoc_phans')->where('ma_hoc_phan', $maHocPhan)->value('id');

            DB::table('phien_ban_ctdt_hoc_phans')->updateOrInsert(
                [
                    'phien_ban_ctdt_id' => $phienBanId,
                    'hoc_phan_id' => $hocPhanId,
                    'chuyen_nganh_id' => null,
                ],
                [
                    'nhom_hoc_phan_id' => $nhomNgoaiNguId,
                    'vai_tro' => 'bat_buoc',
                    'hoc_ky_goi_y' => $hocKyGoiY,
                    'ap_dung_cho' => 'all',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
        }

        $physicalDefenseRequiredCourses = [
            ['QPAD011', 'Giáo dục Quốc phòng - An ninh 1 (Đường lối quốc phòng của Đảng Cộng sản Việt Nam)', 3, null, $trungTamGdqpAn?->id],
            ['QPAD02', 'Giáo dục Quốc phòng - An ninh 2 (Công tác quốc phòng và an ninh)', 2, null, $trungTamGdqpAn?->id],
            ['QPAD033', 'Giáo dục Quốc phòng - An ninh 3 (Quân sự chung)', 1, null, $trungTamGdqpAn?->id],
            ['QPAD044', 'Giáo dục Quốc phòng - An ninh 4 (Kỹ thuật chiến đấu bộ binh và chiến thuật)', 2, null, $trungTamGdqpAn?->id],
            ['85065', 'Giáo dục thể chất (Chạy)', 1, 1, $trungTamTheDucTheThao?->id],
        ];

        foreach ($physicalDefenseRequiredCourses as [$maHocPhan, $tenHocPhan, $soTinChi, $hocKyGoiY, $donViId]) {
            DB::table('hoc_phans')->updateOrInsert(
                ['ma_hoc_phan' => $maHocPhan],
                [
                    'don_vi_id' => $donViId,
                    'ten_hoc_phan' => $tenHocPhan,
                    'so_tin_chi' => $soTinChi,
                    'loai_hoc_phan' => 'khac',
                    'mo_ta' => null,
                    'trang_thai' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );

            $hocPhanId = DB::table('hoc_phans')->where('ma_hoc_phan', $maHocPhan)->value('id');

            DB::table('phien_ban_ctdt_hoc_phans')->updateOrInsert(
                [
                    'phien_ban_ctdt_id' => $phienBanId,
                    'hoc_phan_id' => $hocPhanId,
                    'chuyen_nganh_id' => null,
                ],
                [
                    'nhom_hoc_phan_id' => $nhomTheChatQuocPhongBatBuocId,
                    'vai_tro' => 'bat_buoc',
                    'hoc_ky_goi_y' => $hocKyGoiY,
                    'ap_dung_cho' => 'all',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
        }

        $physicalOptionalCourses = [
            ['85097', 'Giáo dục thể chất (Bóng đá)', 1, 2],
            ['85098', 'Giáo dục thể chất (Bóng chuyền)', 1, 2],
            ['85105', 'Giáo dục thể chất (Cầu lông)', 1, 2],
            ['85108', 'Giáo dục thể chất (Taekwondo)', 1, 2],
            ['85066', 'Giáo dục thể chất (Bơi lội)', 1, 2],
            ['851111', 'Giáo dục thể chất (Aerobic)', 1, 2],
        ];

        foreach ($physicalOptionalCourses as [$maHocPhan, $tenHocPhan, $soTinChi, $hocKyGoiY]) {
            DB::table('hoc_phans')->updateOrInsert(
                ['ma_hoc_phan' => $maHocPhan],
                [
                    'don_vi_id' => $trungTamTheDucTheThao?->id,
                    'ten_hoc_phan' => $tenHocPhan,
                    'so_tin_chi' => $soTinChi,
                    'loai_hoc_phan' => 'khac',
                    'mo_ta' => null,
                    'trang_thai' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );

            $hocPhanId = DB::table('hoc_phans')->where('ma_hoc_phan', $maHocPhan)->value('id');

            DB::table('phien_ban_ctdt_hoc_phans')->updateOrInsert(
                [
                    'phien_ban_ctdt_id' => $phienBanId,
                    'hoc_phan_id' => $hocPhanId,
                    'chuyen_nganh_id' => null,
                ],
                [
                    'nhom_hoc_phan_id' => $nhomTheChatTuChonId,
                    'vai_tro' => 'tu_chon',
                    'hoc_ky_goi_y' => $hocKyGoiY,
                    'ap_dung_cho' => 'all',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
        }

        $majorFoundationRequiredCourses = [
            ['SOT301', 'Nhập môn ngành Công nghệ thông tin', 1, 1],
            ['SOT315', 'Nhập môn lập trình', 3, 2],
            ['SOT320', 'Kỹ thuật lập trình (2LT + 1LT)', 3, 3],
            ['INS326', 'Cấu trúc dữ liệu và giải thuật', 3, 3],
            ['INS330', 'Cơ sở dữ liệu', 3, 3],
            ['NEC329', 'Mạng máy tính', 3, 5],
            ['INT6203', 'Đồ án cơ sở ngành', 3, 5],
            ['NEC321', 'Kiến trúc máy tính', 3, 2],
            ['INS325', 'Hệ điều hành', 3, 2],
            ['SOT347', 'Thiết kế Web', 3, 4],
            ['SOT375', 'Tiếng Anh chuyên ngành (CN thông tin)', 3, 4],
            ['SOT331', 'Lập trình hướng đối tượng', 3, 4],
        ];

        foreach ($majorFoundationRequiredCourses as [$maHocPhan, $tenHocPhan, $soTinChi, $hocKyGoiY]) {
            DB::table('hoc_phans')->updateOrInsert(
                ['ma_hoc_phan' => $maHocPhan],
                [
                    'don_vi_id' => $khoaCntt?->id,
                    'ten_hoc_phan' => $tenHocPhan,
                    'so_tin_chi' => $soTinChi,
                    'loai_hoc_phan' => 'co_so',
                    'mo_ta' => null,
                    'trang_thai' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );

            $hocPhanId = DB::table('hoc_phans')->where('ma_hoc_phan', $maHocPhan)->value('id');

            DB::table('phien_ban_ctdt_hoc_phans')->updateOrInsert(
                [
                    'phien_ban_ctdt_id' => $phienBanId,
                    'hoc_phan_id' => $hocPhanId,
                    'chuyen_nganh_id' => null,
                ],
                [
                    'nhom_hoc_phan_id' => $nhomCoSoNganhBatBuocId,
                    'vai_tro' => 'bat_buoc',
                    'hoc_ky_goi_y' => $hocKyGoiY,
                    'ap_dung_cho' => 'all',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
        }

        $majorFoundationOptionalCourses = [
            ['SOT336', 'Kỹ thuật đồ họa', 3, 4],
            ['SOT341', 'Xử lý ảnh', 3, 4],
            ['SOT345', 'Lập trình thiết bị nhúng', 3, 4],
            ['NEC331', 'Lập trình Java', 3, 4],
        ];

        foreach ($majorFoundationOptionalCourses as [$maHocPhan, $tenHocPhan, $soTinChi, $hocKyGoiY]) {
            DB::table('hoc_phans')->updateOrInsert(
                ['ma_hoc_phan' => $maHocPhan],
                [
                    'don_vi_id' => $khoaCntt?->id,
                    'ten_hoc_phan' => $tenHocPhan,
                    'so_tin_chi' => $soTinChi,
                    'loai_hoc_phan' => 'co_so',
                    'mo_ta' => null,
                    'trang_thai' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );

            $hocPhanId = DB::table('hoc_phans')->where('ma_hoc_phan', $maHocPhan)->value('id');

            DB::table('phien_ban_ctdt_hoc_phans')->updateOrInsert(
                [
                    'phien_ban_ctdt_id' => $phienBanId,
                    'hoc_phan_id' => $hocPhanId,
                    'chuyen_nganh_id' => null,
                ],
                [
                    'nhom_hoc_phan_id' => $nhomCoSoNganhTuChonId,
                    'vai_tro' => 'tu_chon',
                    'hoc_ky_goi_y' => $hocKyGoiY,
                    'ap_dung_cho' => 'all',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
        }

        $upsertIndustryCourse = function (
            array $course,
            int $nhomHocPhanId,
            string $vaiTro,
            string $apDungCho,
            ?int $chuyenNganhId
        ) use ($khoaCntt, $phienBanId): void {
            [$maHocPhan, $tenHocPhan, $soTinChi, $hocKyGoiY] = $course;

            DB::table('hoc_phans')->updateOrInsert(
                ['ma_hoc_phan' => $maHocPhan],
                [
                    'don_vi_id' => $khoaCntt?->id,
                    'ten_hoc_phan' => $tenHocPhan,
                    'so_tin_chi' => $soTinChi,
                    'loai_hoc_phan' => 'chuyen_nganh',
                    'mo_ta' => null,
                    'trang_thai' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );

            $hocPhanId = DB::table('hoc_phans')->where('ma_hoc_phan', $maHocPhan)->value('id');

            DB::table('phien_ban_ctdt_hoc_phans')->updateOrInsert(
                [
                    'phien_ban_ctdt_id' => $phienBanId,
                    'hoc_phan_id' => $hocPhanId,
                    'chuyen_nganh_id' => $chuyenNganhId,
                ],
                [
                    'nhom_hoc_phan_id' => $nhomHocPhanId,
                    'vai_tro' => $vaiTro,
                    'hoc_ky_goi_y' => $hocKyGoiY,
                    'ap_dung_cho' => $apDungCho,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
        };

        $industryCommonRequiredCourses = [
            ['INS339', 'Hệ quản trị cơ sở dữ liệu', 3, 4],
            ['SOT379', 'Lập trình thiết bị di động', 4, 6],
            ['INS360', 'Phân tích thiết kế hệ thống thông tin', 3, 5],
            ['INT6900', 'Thực tập ngành nghề', 3, 7],
        ];

        foreach ($industryCommonRequiredCourses as $course) {
            $upsertIndustryCourse(
                $course,
                (int) $industryGroupIds['GDCN_NGANH_CHUNG_BB'],
                'bat_buoc',
                'all',
                null,
            );
        }

        $industryRequiredBySpecialization = [
            'CNPM' => [
                ['SOT355', 'Phát triển ứng dụng Web', 3, 5],
                ['SOT332', 'Toán rời rạc', 3, 6],
                ['SOT349', 'Công nghệ phần mềm', 3, 6],
                ['SOT380', 'Kiến trúc và thiết kế phần mềm', 3, 6],
                ['SOT357', 'Kiểm thử phần mềm', 3, 7],
                ['NEC326', 'An toàn và bảo mật thông tin', 3, 7],
                ['SOT344', 'Trí tuệ nhân tạo', 3, 7],
            ],
            'HTTT' => [
                ['SOT355', 'Phát triển ứng dụng Web', 3, 5],
                ['SOT332', 'Toán rời rạc', 3, 6],
                ['INS362', 'Khai phá dữ liệu', 3, 6],
                ['INS305', 'Hệ hỗ trợ quyết định', 3, 6],
                ['INT6204', 'Hệ thống hoạch định nguồn lực doanh nghiệp', 3, 7],
                ['NEC326', 'An toàn và bảo mật thông tin', 3, 7],
                ['INS361', 'Cơ sở dữ liệu phân tán', 3, 7],
            ],
            'TTMMT' => [
                ['INT6205', 'Linux server và quản trị mạng', 3, 5],
                ['INT6206', 'Lý thuyết đồ thị trong Hệ thống mạng', 3, 6],
                ['NEC327', 'Nguyên lý máy học', 3, 6],
                ['NEC350', 'Thiết kế và cài đặt mạng', 3, 6],
                ['NEC324', 'Mạng không dây và di động', 3, 7],
                ['NEC355', 'An toàn mạng', 3, 7],
                ['INT6201', 'Học sâu ứng dụng', 3, 7],
            ],
        ];

        foreach ($industryRequiredBySpecialization as $maChuyenNganh => $coursesBySpecialization) {
            $groupId = (int) $industryGroupIds['GDCN_' . $maChuyenNganh . '_BB'];
            $chuyenNganhId = (int) $chuyenNganhIds[$maChuyenNganh];

            foreach ($coursesBySpecialization as $course) {
                $upsertIndustryCourse($course, $groupId, 'bat_buoc', 'specialization', $chuyenNganhId);
            }
        }

        $industryOptionalBySpecialization = [
            'CNPM' => [
                ['INS335', 'Thống kê máy tính', 3, 5],
                ['INS365', 'Hệ thống thông tin địa lý (GIS)', 3, 5],
                ['SOT352', 'Quản lý dự án phần mềm', 3, 6],
                ['INT6207', 'IoT và Ứng dụng', 3, 6],
                ['SOT366', 'Phát triển phần mềm mã nguồn mở', 3, 7],
                ['INT6208', 'Phát triển phần mềm hướng đối tượng', 3, 5],
                ['INT6209', 'Các chủ đề nâng cao trong công nghệ phần mềm', 3, 7],
                ['TRE312', 'Thương mại điện tử (CNTT)', 3, 7],
            ],
            'HTTT' => [
                ['INS335', 'Thống kê máy tính', 3, 5],
                ['INS365', 'Hệ thống thông tin địa lý (GIS)', 3, 5],
                ['INS304', 'Phân tích số liệu và Kinh doanh thông minh', 3, 6],
                ['INT6210', 'Quản lý rủi ro', 3, 6],
                ['TRE312', 'Thương mại điện tử (CNTT)', 3, 7],
                ['INT6211', 'Ứng dụng cơ sở dữ liệu', 3, 7],
            ],
            'TTMMT' => [
                ['NEC311', 'Lập trình Python', 3, 5],
                ['INT6212', 'Xử lý tín hiệu số', 3, 5],
                ['INT6213', 'Chuyên đề Truyền thông và Mạng máy tính', 3, 6],
                ['INT6214', 'Mạng thế hệ mới', 3, 6],
                ['INT6207', 'IoT và Ứng dụng', 3, 7],
                ['INT6215', 'Kỹ thuật phát hiện và tấn công mạng', 3, 7],
                ['INT6202', 'Dữ liệu đa phương tiện', 3, 7],
            ],
        ];

        foreach ($industryOptionalBySpecialization as $maChuyenNganh => $coursesBySpecialization) {
            $groupId = (int) $industryGroupIds['GDCN_' . $maChuyenNganh . '_TC'];
            $chuyenNganhId = (int) $chuyenNganhIds[$maChuyenNganh];

            foreach ($coursesBySpecialization as $course) {
                $upsertIndustryCourse($course, $groupId, 'tu_chon', 'specialization', $chuyenNganhId);
            }
        }

        $graduationCommonCourses = [
            ['INT6901', 'Đồ án tốt nghiệp (Công nghệ Thông tin)', 10, 8],
            ['INT6902', 'Chuyên đề tốt nghiệp (CNTT)', 5, 8],
        ];

        foreach ($graduationCommonCourses as $course) {
            $upsertIndustryCourse(
                $course,
                (int) $industryGroupIds['GDCN_TOTNGHIEP_CHUNG'],
                'tu_chon',
                'all',
                null,
            );
        }

        $graduationReplacementBySpecialization = [
            'CNPM' => [
                ['INT6216', 'Xử lý dữ liệu lớn', 2, 8],
                ['INT6217', 'Học máy', 3, 8],
            ],
            'HTTT' => [
                ['INT6216', 'Xử lý dữ liệu lớn', 2, 8],
                ['INT6218', 'Quản lý dự án hệ thống thông tin', 3, 8],
            ],
            'TTMMT' => [
                ['CCN6201', 'Đánh giá hiệu năng mạng', 2, 8],
                ['NEC360', 'Điện toán đám mây', 3, 8],
            ],
        ];

        foreach ($graduationReplacementBySpecialization as $maChuyenNganh => $coursesBySpecialization) {
            $groupId = (int) $industryGroupIds['GDCN_TOTNGHIEP_' . $maChuyenNganh];
            $chuyenNganhId = (int) $chuyenNganhIds[$maChuyenNganh];

            foreach ($coursesBySpecialization as $course) {
                $upsertIndustryCourse($course, $groupId, 'tu_chon', 'specialization', $chuyenNganhId);
            }
        }

        $prerequisites = [
            'POL309' => ['POL307'],
            'POL308' => ['POL307', 'POL309'],
            'POL333' => ['POL309', 'POL308'],
            'POL310' => ['POL333', 'POL308', 'POL309'],
            'MAT328' => ['MAT327'],
            'MAT322' => ['MAT327', 'MAT328'],
            'FLS315' => ['FLS314'],
        ];

        foreach ($prerequisites as $maHocPhan => $maTienQuyets) {
            $hocPhanId = DB::table('hoc_phans')->where('ma_hoc_phan', $maHocPhan)->value('id');

            foreach ($maTienQuyets as $maTienQuyet) {
                $tienQuyetId = DB::table('hoc_phans')->where('ma_hoc_phan', $maTienQuyet)->value('id');

                if (! $hocPhanId || ! $tienQuyetId || $hocPhanId === $tienQuyetId) {
                    continue;
                }

                DB::table('hoc_phan_tien_quyets')->updateOrInsert(
                    [
                        'hoc_phan_id' => $hocPhanId,
                        'hoc_phan_tien_quyet_id' => $tienQuyetId,
                    ],
                    [
                        'loai' => 'bat_buoc',
                        'ghi_chu' => null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                );
            }
        }

        $concurrentCourses = [
            'PHY311' => ['PHY310'],
        ];

        foreach ($concurrentCourses as $maHocPhan => $maSongHanhs) {
            $hocPhanId = DB::table('hoc_phans')->where('ma_hoc_phan', $maHocPhan)->value('id');

            foreach ($maSongHanhs as $maSongHanh) {
                $songHanhId = DB::table('hoc_phans')->where('ma_hoc_phan', $maSongHanh)->value('id');

                if (! $hocPhanId || ! $songHanhId || $hocPhanId === $songHanhId) {
                    continue;
                }

                DB::table('hoc_phan_song_hanhs')->updateOrInsert(
                    [
                        'hoc_phan_id' => $hocPhanId,
                        'hoc_phan_song_hanh_id' => $songHanhId,
                    ],
                    [
                        'ghi_chu' => null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                );
            }
        }

        $timeAllocations = [
            'POL307' => [45, null],
            'POL309' => [30, null],
            'POL308' => [30, null],
            'POL333' => [30, null],
            'POL310' => [30, null],
            'SSH313' => [30, null],
            'SSH378' => [45, null],
            'SSH379' => [30, null],
            'SSH381' => [30, null],
            'BUA319' => [30, null],
            'MKT372' => [30, null],
            'MAT327' => [45, null],
            'MAT328' => [30, null],
            'MAT322' => [45, null],
            'SOT381' => [30, 30],
            'PHY310' => [45, null],
            'PHY311' => [null, 30],
            'FLS314' => [60, null],
            'FLS315' => [60, null],
            'QPAD011' => [45, null],
            'QPAD02' => [30, null],
            'QPAD033' => [14, 16],
            'QPAD044' => [null, 60],
            '85065' => [4, 22],
            '85097' => [4, 22],
            '85098' => [4, 22],
            '85105' => [4, 22],
            '85108' => [4, 22],
            '85066' => [4, 22],
            '851111' => [4, 22],
            'SOT301' => [15, null],
            'SOT315' => [30, 30],
            'SOT320' => [30, 30],
            'INS326' => [30, 30],
            'INS330' => [45, null],
            'NEC329' => [30, 30],
            'INT6203' => [4, 86],
            'NEC321' => [45, null],
            'INS325' => [45, null],
            'SOT347' => [30, 30],
            'SOT375' => [45, null],
            'SOT331' => [30, 30],
            'SOT336' => [30, 30],
            'SOT341' => [30, 30],
            'SOT345' => [30, 30],
            'NEC331' => [30, 30],
            'INS339' => [30, 30],
            'SOT379' => [45, 30],
            'INS360' => [45, null],
            'INT6900' => [null, 90],
            'SOT355' => [30, 30],
            'SOT332' => [30, 30],
            'SOT349' => [45, null],
            'SOT380' => [30, 30],
            'SOT357' => [30, 30],
            'NEC326' => [45, null],
            'SOT344' => [30, 30],
            'INS362' => [30, 30],
            'INS305' => [30, 30],
            'INT6204' => [30, 30],
            'INS361' => [30, 30],
            'INT6205' => [30, 30],
            'INT6206' => [45, null],
            'NEC327' => [30, 30],
            'NEC350' => [30, 30],
            'NEC324' => [30, 30],
            'NEC355' => [30, 30],
            'INT6201' => [30, 30],
            'INS335' => [30, 30],
            'INS365' => [30, 30],
            'SOT352' => [45, null],
            'INT6207' => [30, 30],
            'SOT366' => [30, 30],
            'INT6208' => [30, 30],
            'INT6209' => [30, 30],
            'TRE312' => [30, 30],
            'INS304' => [30, 30],
            'INT6210' => [30, 30],
            'INT6211' => [30, 30],
            'NEC311' => [30, 30],
            'INT6212' => [30, 30],
            'INT6213' => [30, 30],
            'INT6214' => [30, 30],
            'INT6215' => [30, 30],
            'INT6202' => [30, 30],
            'INT6901' => [null, 300],
            'INT6902' => [null, 150],
            'INT6216' => [15, 30],
            'INT6217' => [30, 30],
            'INT6218' => [30, 30],
            'CCN6201' => [15, 30],
            'NEC360' => [30, 30],
        ];

        foreach ($timeAllocations as $maHocPhan => [$soTietLyThuyet, $soTietThucHanh]) {
            DB::table('hoc_phans')
                ->where('ma_hoc_phan', $maHocPhan)
                ->update([
                    'so_tiet_ly_thuyet' => $soTietLyThuyet,
                    'so_tiet_thuc_hanh' => $soTietThucHanh,
                    'updated_at' => now(),
                ]);
        }

        $this->command->info('✓ CTĐT CNTT, phiên bản K65, học phần và tiên quyết đã được cập nhật.');
    }
}
