<?php

namespace Database\Seeders;

use App\Models\DonVi;
use App\Models\NganhDaoTao;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class HtttqlK65CurriculumSeeder extends Seeder
{
    public function run(): void
    {
        $nganh = NganhDaoTao::query()->where('ma_nganh', '7340405')->first();

        if (! $nganh) {
            $this->command->warn('Không tìm thấy ngành Hệ thống thông tin quản lý. Hãy chạy NganhDaoTaoSeeder trước.');

            return;
        }

        $donViIds = DonVi::query()
            ->whereIn('ma_don_vi', ['KCNTT', 'KKHXHNV', 'KNN', 'TKTKD', 'TKTCN', 'TTDTT', 'TTGDQPAN'])
            ->pluck('id', 'ma_don_vi');

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
            ['ma_ctdt' => 'HTTTQL'],
            [
                'ten_ctdt' => 'Chương trình đào tạo Hệ thống thông tin quản lý',
                'nganh_dao_tao_id' => $nganh->id,
                'chuyen_nganh_id' => null,
                'khoa_tuyen_sinh_id' => $khoaTuyenSinhId,
                'tong_tin_chi_yeu_cau' => 138,
                'mo_ta' => 'Chương trình đào tạo ngành Hệ thống thông tin quản lý.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        $ctdtId = DB::table('chuong_trinh_dao_taos')->where('ma_ctdt', 'HTTTQL')->value('id');

        DB::table('phien_ban_ctdts')->updateOrInsert(
            [
                'chuong_trinh_dao_tao_id' => $ctdtId,
                'version_no' => 1,
            ],
            [
                'hieu_luc_tu' => '2023-09-01',
                'hieu_luc_den' => null,
                'trang_thai' => 'published',
                'ghi_chu' => 'Phiên bản CTĐT đang áp dụng cho sinh viên K65 ngành Hệ thống thông tin quản lý.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        $phienBanId = DB::table('phien_ban_ctdts')
            ->where('chuong_trinh_dao_tao_id', $ctdtId)
            ->where('version_no', 1)
            ->value('id');

        DB::table('sinh_viens')
            ->where('nganh_dao_tao_id', $nganh->id)
            ->orWhere('ma_lop', 'like', '65.HTTTQL%')
            ->orWhere('ten_nganh_hoc', 'like', '%Hệ thống thông tin quản lý%')
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
                        'ghi_chu' => 'Tự động gán CTĐT HTTTQL cho sinh viên K65.',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                );
            });

        $groups = [
            ['GDTC_XHNVNT_BB', 'Xã hội, Nhân văn và Nghệ thuật - học phần bắt buộc', 18, 8, true, 1],
            ['GDTC_XHNVNT_TC', 'Xã hội, Nhân văn và Nghệ thuật - học phần tự chọn', 2, 1, false, 2],
            ['GDTC_TOANTINTN_CNMT_BB', 'Toán, Tin học, Tự nhiên, CN&MT - học phần bắt buộc', 9, 3, true, 3],
            ['GDTC_NGOAINGU_BB', 'Ngoại ngữ - học phần bắt buộc', 8, 2, true, 4],
            ['GDTC_TCQPAN_BB', 'Thể chất và Quốc phòng - An ninh - học phần bắt buộc', 9, 5, true, 5],
            ['GDTC_THECHAT_TC', 'Thể chất và Quốc phòng - An ninh - học phần tự chọn', 2, 2, false, 6],
            ['GDCN_COSONGANH_BB', 'Cơ sở ngành - học phần bắt buộc', 41, 14, true, 7],
            ['GDCN_COSONGANH_TC', 'Cơ sở ngành - học phần tự chọn', 6, 2, false, 8],
            ['GDCN_NGANH_BB', 'Ngành - học phần bắt buộc', 27, 9, true, 9],
            ['GDCN_NGANH_TC', 'Ngành - học phần tự chọn', 6, 2, false, 10],
            ['GDCN_TOTNGHIEP_CHUNG', 'Tốt nghiệp - đồ án/khóa luận tốt nghiệp hoặc học phần thay thế', 10, 3, false, 11],
        ];

        foreach ($groups as [$maNhom, $tenNhom, $minTinChi, $minSoMon, $batBuocToanBo, $thuTu]) {
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

        $groupIds = DB::table('nhom_hoc_phans')
            ->where('phien_ban_ctdt_id', $phienBanId)
            ->whereIn('ma_nhom', array_column($groups, 0))
            ->pluck('id', 'ma_nhom');

        $courses = [
            ['POL307', 'Triết học Mác - Lênin', 3, 1, 'GDTC_XHNVNT_BB', 'bat_buoc', 'KKHXHNV', 'khac', 45, null],
            ['POL309', 'Kinh tế chính trị Mác - Lênin', 2, 2, 'GDTC_XHNVNT_BB', 'bat_buoc', 'KKHXHNV', 'khac', 30, null],
            ['POL308', 'Chủ nghĩa xã hội khoa học', 2, 3, 'GDTC_XHNVNT_BB', 'bat_buoc', 'KKHXHNV', 'khac', 30, null],
            ['POL333', 'Tư tưởng Hồ Chí Minh', 2, 5, 'GDTC_XHNVNT_BB', 'bat_buoc', 'KKHXHNV', 'khac', 30, null],
            ['POL310', 'Lịch sử Đảng Cộng sản Việt Nam', 2, 4, 'GDTC_XHNVNT_BB', 'bat_buoc', 'KKHXHNV', 'khac', 30, null],
            ['SSH313', 'Pháp luật đại cương', 2, 1, 'GDTC_XHNVNT_BB', 'bat_buoc', 'KKHXHNV', 'khac', 30, null],
            ['SSH378', 'Tư duy phản biện', 3, 4, 'GDTC_XHNVNT_BB', 'bat_buoc', 'KKHXHNV', 'khac', 45, null],
            ['SSH379', 'Ngôn ngữ học thuật', 2, 5, 'GDTC_XHNVNT_BB', 'bat_buoc', 'KKHXHNV', 'khac', 30, null],
            ['SSH381', 'Thưởng thức mỹ thuật', 2, 3, 'GDTC_XHNVNT_TC', 'tu_chon', 'KKHXHNV', 'khac', 30, null],
            ['SSH383', 'Khởi nghiệp và đổi mới sáng tạo', 2, 3, 'GDTC_XHNVNT_TC', 'tu_chon', 'KKHXHNV', 'khac', 30, null],
            ['MAT327', 'Toán 1', 3, 1, 'GDTC_TOANTINTN_CNMT_BB', 'bat_buoc', 'TKTCN', 'co_so', 45, null],
            ['MAT322', 'Xác suất - Thống kê', 3, 3, 'GDTC_TOANTINTN_CNMT_BB', 'bat_buoc', 'TKTCN', 'co_so', 45, null],
            ['SOT381', 'Tin học đại cương A (LT+TH)', 3, 1, 'GDTC_TOANTINTN_CNMT_BB', 'bat_buoc', 'KCNTT', 'co_so', 30, 30],
            ['FLS314', 'Ngoại ngữ 1 (B1.1)', 4, 1, 'GDTC_NGOAINGU_BB', 'bat_buoc', 'KNN', 'khac', 60, null],
            ['FLS315', 'Ngoại ngữ 2 (B1.2)', 4, 2, 'GDTC_NGOAINGU_BB', 'bat_buoc', 'KNN', 'khac', 60, null],
            ['QPAD011', 'Giáo dục Quốc phòng - An ninh 1 (Đường lối quốc phòng của Đảng Cộng sản Việt Nam)', 3, 1, 'GDTC_TCQPAN_BB', 'bat_buoc', 'TTGDQPAN', 'khac', 45, null],
            ['QPAD02', 'Giáo dục Quốc phòng - An ninh 2 (Công tác quốc phòng và an ninh)', 2, null, 'GDTC_TCQPAN_BB', 'bat_buoc', 'TTGDQPAN', 'khac', 30, null],
            ['QPAD033', 'Giáo dục Quốc phòng - An ninh 3 (Quân sự chung)', 1, null, 'GDTC_TCQPAN_BB', 'bat_buoc', 'TTGDQPAN', 'khac', 14, 16],
            ['QPAD044', 'Giáo dục Quốc phòng - An ninh 4 (Kỹ thuật chiến đấu bộ binh và chiến thuật)', 2, null, 'GDTC_TCQPAN_BB', 'bat_buoc', 'TTGDQPAN', 'khac', null, 60],
            ['85065', 'Giáo dục thể chất (Chạy)', 1, 1, 'GDTC_TCQPAN_BB', 'bat_buoc', 'TTDTT', 'khac', 4, 22],
            ['85097', 'Giáo dục thể chất (Bóng đá)', 1, 2, 'GDTC_THECHAT_TC', 'tu_chon', 'TTDTT', 'khac', 4, 22],
            ['85098', 'Giáo dục thể chất (Bóng chuyền)', 1, 2, 'GDTC_THECHAT_TC', 'tu_chon', 'TTDTT', 'khac', 4, 22],
            ['85105', 'Giáo dục thể chất (Cầu lông)', 1, 2, 'GDTC_THECHAT_TC', 'tu_chon', 'TTDTT', 'khac', 4, 22],
            ['85108', 'Giáo dục thể chất (Taekwondo)', 1, 3, 'GDTC_THECHAT_TC', 'tu_chon', 'TTDTT', 'khac', 4, 22],
            ['85066', 'Giáo dục thể chất (Bơi lội)', 1, 3, 'GDTC_THECHAT_TC', 'tu_chon', 'TTDTT', 'khac', 4, 22],
            ['851111', 'Giáo dục thể chất (Aerobic)', 1, 3, 'GDTC_THECHAT_TC', 'tu_chon', 'TTDTT', 'khac', 4, 22],
            ['INS301', 'Nhập môn ngành Hệ thống thông tin quản lý', 1, 1, 'GDCN_COSONGANH_BB', 'bat_buoc', 'KCNTT', 'co_so', 15, null],
            ['ECS375', 'Thống kê ứng dụng trong kinh tế và kinh doanh', 3, 3, 'GDCN_COSONGANH_BB', 'bat_buoc', 'TKTKD', 'co_so', 45, null],
            ['INS330', 'Cơ sở dữ liệu', 3, 2, 'GDCN_COSONGANH_BB', 'bat_buoc', 'KCNTT', 'co_so', 45, null],
            ['INS324', 'Lập trình CSDL (Access/Excel/VBA)', 3, 2, 'GDCN_COSONGANH_BB', 'bat_buoc', 'KCNTT', 'co_so', 30, 30],
            ['BUA329', 'Hệ thống thông tin quản lý', 3, 3, 'GDCN_COSONGANH_BB', 'bat_buoc', 'TKTKD', 'co_so', 45, null],
            ['INS344', 'Phân tích thiết kế hệ thống thông tin (HTTTQL)', 4, 4, 'GDCN_COSONGANH_BB', 'bat_buoc', 'KCNTT', 'co_so', 60, null],
            ['NEC335', 'Mạng máy tính và bảo mật', 3, 4, 'GDCN_COSONGANH_BB', 'bat_buoc', 'KCNTT', 'co_so', 30, 30],
            ['ECS329', 'Kinh tế vi mô', 3, 4, 'GDCN_COSONGANH_BB', 'bat_buoc', 'TKTKD', 'co_so', 45, null],
            ['ECS330', 'Kinh tế vĩ mô', 3, 5, 'GDCN_COSONGANH_BB', 'bat_buoc', 'TKTKD', 'co_so', 45, null],
            ['ACC325', 'Nguyên lý kế toán', 3, 2, 'GDCN_COSONGANH_BB', 'bat_buoc', 'TKTKD', 'co_so', 45, null],
            ['SOT305', 'Quản lý dự án Công nghệ thông tin', 3, 5, 'GDCN_COSONGANH_BB', 'bat_buoc', 'KCNTT', 'co_so', 45, null],
            ['ECS335', 'Marketing căn bản', 3, 6, 'GDCN_COSONGANH_BB', 'bat_buoc', 'TKTKD', 'co_so', 45, null],
            ['BUA325', 'Quản trị học', 3, 3, 'GDCN_COSONGANH_BB', 'bat_buoc', 'TKTKD', 'co_so', 45, null],
            ['INS302', 'Thiết kế và lập trình Web 1', 3, 5, 'GDCN_COSONGANH_BB', 'bat_buoc', 'KCNTT', 'co_so', 30, 30],
            ['BUA336', 'Luật kinh doanh', 3, 3, 'GDCN_COSONGANH_TC', 'tu_chon', 'TKTKD', 'co_so', 45, null],
            ['BUA3024', 'Tiếng Anh kinh doanh', 3, 3, 'GDCN_COSONGANH_TC', 'tu_chon', 'TKTKD', 'co_so', 45, null],
            ['SOT349', 'Công nghệ phần mềm', 3, 4, 'GDCN_COSONGANH_TC', 'tu_chon', 'KCNTT', 'co_so', 45, null],
            ['ACC352', 'Kế toán tài chính', 3, 4, 'GDCN_COSONGANH_TC', 'tu_chon', 'TKTKD', 'co_so', 45, null],
            ['INS339', 'Hệ quản trị cơ sở dữ liệu', 3, 5, 'GDCN_NGANH_BB', 'bat_buoc', 'KCNTT', 'chuyen_nganh', 30, 30],
            ['SOT306', 'Thiết kế lập trình Web 2', 3, 6, 'GDCN_NGANH_BB', 'bat_buoc', 'KCNTT', 'chuyen_nganh', 30, 30],
            ['INS304', 'Phân tích số liệu và Kinh doanh thông minh', 3, 6, 'GDCN_NGANH_BB', 'bat_buoc', 'KCNTT', 'chuyen_nganh', 30, 30],
            ['INS362', 'Khai phá dữ liệu', 3, 7, 'GDCN_NGANH_BB', 'bat_buoc', 'KCNTT', 'chuyen_nganh', 30, 30],
            ['BUA3014', 'Hệ thống hoạch định nguồn lực doanh nghiệp', 3, 6, 'GDCN_NGANH_BB', 'bat_buoc', 'TKTKD', 'chuyen_nganh', 45, null],
            ['TRE344', 'Thương mại điện tử', 3, 7, 'GDCN_NGANH_BB', 'bat_buoc', 'TKTKD', 'chuyen_nganh', 45, null],
            ['ECS332', 'Kinh tế lượng', 3, 7, 'GDCN_NGANH_BB', 'bat_buoc', 'TKTKD', 'chuyen_nganh', 45, null],
            ['INS305', 'Hệ hỗ trợ quyết định', 3, 7, 'GDCN_NGANH_BB', 'bat_buoc', 'KCNTT', 'chuyen_nganh', 30, 30],
            ['MIS6900', 'Thực tập doanh nghiệp', 3, 7, 'GDCN_NGANH_BB', 'bat_buoc', 'KCNTT', 'chuyen_nganh', 4, 86],
            ['INS303', 'Thiết kế giao diện', 3, 5, 'GDCN_NGANH_TC', 'tu_chon', 'KCNTT', 'chuyen_nganh', 30, 30],
            ['SOT357', 'Kiểm thử phần mềm', 3, 6, 'GDCN_NGANH_TC', 'tu_chon', 'KCNTT', 'chuyen_nganh', 30, 30],
            ['FIB343', 'Tài chính doanh nghiệp', 3, 5, 'GDCN_NGANH_TC', 'tu_chon', 'TKTKD', 'chuyen_nganh', 45, null],
            ['TRE365', 'Quản trị chuỗi cung ứng', 3, 6, 'GDCN_NGANH_TC', 'tu_chon', 'TKTKD', 'chuyen_nganh', 45, null],
            ['MIS6201', 'Machine Learning/Data Science in Business/Big Data và Ứng dụng', 3, 8, 'GDCN_TOTNGHIEP_CHUNG', 'tu_chon', 'KCNTT', 'chuyen_nganh', 30, 30],
            ['MIS6202', 'Lập trình kế toán máy (Kế toán máy bằng Access)', 2, 8, 'GDCN_TOTNGHIEP_CHUNG', 'tu_chon', 'KCNTT', 'chuyen_nganh', 15, 30],
            ['INT6902', 'Chuyên đề tốt nghiệp', 5, 8, 'GDCN_TOTNGHIEP_CHUNG', 'tu_chon', 'KCNTT', 'chuyen_nganh', null, 150],
        ];

        foreach ($courses as [$maHocPhan, $tenHocPhan, $soTinChi, $hocKyGoiY, $maNhom, $vaiTro, $maDonVi, $loaiHocPhan, $soTietLyThuyet, $soTietThucHanh]) {
            DB::table('hoc_phans')->updateOrInsert(
                ['ma_hoc_phan' => $maHocPhan],
                [
                    'don_vi_id' => $donViIds[$maDonVi] ?? null,
                    'ten_hoc_phan' => $tenHocPhan,
                    'so_tin_chi' => $soTinChi,
                    'loai_hoc_phan' => $loaiHocPhan,
                    'mo_ta' => null,
                    'trang_thai' => true,
                    'so_tiet_ly_thuyet' => $soTietLyThuyet,
                    'so_tiet_thuc_hanh' => $soTietThucHanh,
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
                    'nhom_hoc_phan_id' => $groupIds[$maNhom],
                    'vai_tro' => $vaiTro,
                    'hoc_ky_goi_y' => $hocKyGoiY,
                    'ap_dung_cho' => 'all',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
        }

        $this->command->info('✓ CTĐT HTTTQL K65, học phần và kế hoạch học tập 8 kỳ đã được cập nhật.');
    }
}
