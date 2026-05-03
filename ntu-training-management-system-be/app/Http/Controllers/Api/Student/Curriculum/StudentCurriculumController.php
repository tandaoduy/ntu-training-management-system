<?php

namespace App\Http\Controllers\Api\Student\Curriculum;

use App\Http\Controllers\Controller;
use App\Models\HeThongCauHinh;
use App\Models\HocKy;
use App\Models\PhienBanCtdt;
use App\Models\SinhVien;
use App\Models\SinhVienChuongTrinh;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class StudentCurriculumController extends Controller
{
    private const DCHP_FILE_BY_COURSE_CODE = [
        '85065' => '85065-Giáo dục thể chất (Chạy).pdf',
        '85066' => '85066-Giáo dục thể chất (Bơi lội).pdf',
        '85097' => '85097-Giáo dục thể chất (Bóng đá).pdf',
        '85098' => '85098-Giáo dục thể chất (Bóng chuyền).pdf',
        '85105' => '85105-Giáo dục thể chất (Cầu lông).pdf',
        '85108' => '85108-Giáo dục thể chất (Taekwondo).pdf',
        '851111' => '851111-Giáo dục thể chất (Aerobic).pdf',
        'BUA319' => 'BUA319-Nhập môn Quản trị học.pdf',
        'CCN6201' => 'CCN6201-Đánh giá hiệu năng mạng.pdf',
        'FLS314' => 'FLS314-Tiếng anh B1.1.pdf',
        'FLS315' => 'FLS315-Tiếng anh B1.2.pdf',
        'INS304' => 'INS304-Phân tích số liệu và Kinh doanh thông minh.pdf',
        'INS305' => 'INS305-Hệ hỗ trợ quyết định.pdf',
        'INS325' => 'INS325-Hệ điều hành.pdf',
        'INS326' => 'INS326-Cấu trúc dữ liệu và giải thuật.pdf',
        'INS330' => 'INS330-Cơ sở dữ liệu.pdf',
        'INS335' => 'INS335-Thống kê máy tính.pdf',
        'INS339' => 'INS339-Hệ quản trị cơ sở dữ liệu.pdf',
        'INS360' => 'INS360-Phân tích thiết kế hệ thống thông tin.pdf',
        'INS361' => 'INS361-Cơ sở dữ liệu phân tán.pdf',
        'INS362' => 'INS362-Khai phá dữ liệu.pdf',
        'INS365' => 'INS365-Hệ thống thông tin địa lý (GIS).pdf',
        'INT6201' => 'INT6201-Học sâu ứng dụng.pdf',
        'INT6202' => 'INT6202-Dữ liệu đa phương tiện.pdf',
        'INT6203' => 'INT6203-Đồ án cơ sở ngành.pdf',
        'INT6204' => 'INT6204-Hệ thống hoạch định nguồn lực doanh nghiệp.pdf',
        'INT6205' => 'INT6205-Linux server và quản trị mạng.pdf',
        'INT6206' => 'INT6206-Lý thuyết đồ thị trong Hệ thống mạng.pdf',
        'INT6207' => 'INT6207-IoT và Ứng dụng.pdf',
        'INT6208' => 'INT6208-Phát triển phần mềm hướng đối tượng.pdf',
        'INT6209' => 'INT6209-Các chủ đề nâng cao trong công nghệ phần mềm.pdf',
        'INT6210' => 'INT6210-Quản lý rủi ro.pdf',
        'INT6211' => 'INT6211-Ứng dụng cơ sở dữ liệu.pdf',
        'INT6212' => 'INT6212-Xử lý tín hiệu số.pdf',
        'INT6213' => 'INT6213-Chuyên đề Truyền thông và Mạng máy tính.pdf',
        'INT6214' => 'INT6214-Mạng thế hệ mới.pdf',
        'INT6215' => 'INT6215-Kỹ thuật phát hiện và tấn công mạng.pdf',
        'INT6216' => 'INT6216-Xử lý dữ liệu lớn.pdf',
        'INT6217' => 'INT6217-Học máy.pdf',
        'INT6218' => 'INT6218-Quản lý dự án hệ thống thông tin.pdf',
        'INT6900' => 'INT6900-Thực tập ngành nghề.pdf',
        'INT6901' => 'INT6901-Đồ án tốt nghiệp (Công nghệ Thông tin).pdf',
        'INT6902' => 'INT6902-Chuyên đề tốt nghiệp (CNTT).pdf',
        'MAT322' => 'MAT322-Xác suất - Thống kê.pdf',
        'MAT327' => 'MAT327-Toán 1.pdf',
        'MAT328' => 'MAT328-Toán 2.pdf',
        'MKT372' => 'MKT372-Nhập môn Marketing.pdf',
        'NEC311' => 'NEC311-Lập trình Python.pdf',
        'NEC321' => 'NEC321-Kiến trúc máy tính.pdf',
        'NEC324' => 'NEC324-Mạng không dây và di động.pdf',
        'NEC326' => 'NEC326-An toàn và bảo mật thông tin.pdf',
        'NEC327' => 'NEC327-Nguyên lý máy học.pdf',
        'NEC329' => 'NEC329-Mạng máy tính.pdf',
        'NEC331' => 'NEC331-Lập trình Java.pdf',
        'NEC350' => 'NEC350-Thiết kế và cài đặt mạng.pdf',
        'NEC355' => 'NEC355-An toàn mạng.pdf',
        'NEC360' => 'NEC360-Điện toán đám mây.pdf',
        'PHY310' => 'PHY310-Vật lý đại cương 1.pdf',
        'PHY311' => 'PHY311-T.Hành Vật lý đại cương 1.pdf',
        'POL307' => 'POL307-Triết học Mác - Lênin.pdf',
        'POL308' => 'POL308-Chủ nghĩa xã hội khoa học.pdf',
        'POL309' => 'POL309-Kinh tế chính trị Mác - Lênin.pdf',
        'POL310' => 'POL310-Lịch sử Đảng Cộng sản Việt Nam.pdf',
        'POL333' => 'POL333-Tư tưởng Hồ Chí Minh.pdf',
        'QPAD011' => 'QPAD011-Giáo dục Quốc phòng - An ninh 1 (Đường lối quốc phòng của Đảng Cộng sản Việt Nam).pdf',
        'QPAD02' => 'QPAD02-Giáo dục Quốc phòng - An ninh 2 (Công tác quốc phòng và an ninh).pdf',
        'QPAD033' => 'QPAD033-Giáo dục Quốc phòng - An ninh 3 (Quân sự chung).pdf',
        'QPAD044' => 'QPAD044-Giáo dục Quốc phòng - An ninh 4 (Kỹ thuật chiến đấu bộ binh và chiến thuật).pdf',
        'SOT301' => 'SOT301-Nhập môn ngành Công nghệ thông tin.pdf',
        'SOT315' => 'SOT315-Nhập môn lập trình.pdf',
        'SOT320' => 'SOT320-Kỹ thuật lập trình (2LT + 1LT).pdf',
        'SOT331' => 'SOT331-Lập trình hướng đối tượng.pdf',
        'SOT332' => 'SOT332-Toán rời rạc.pdf',
        'SOT336' => 'SOT336-Kỹ thuật đồ họa.pdf',
        'SOT341' => 'SOT341-Xử lý ảnh.pdf',
        'SOT344' => 'SOT344-Trí tuệ nhân tạo.pdf',
        'SOT345' => 'SOT345-Lập trình thiết bị nhúng.pdf',
        'SOT347' => 'SOT347-Thiết kế Web.pdf',
        'SOT349' => 'SOT349-Công nghệ phần mềm.pdf',
        'SOT352' => 'SOT352-Quản lý dự án phần mềm.pdf',
        'SOT355' => 'SOT355-Phát triển ứng dụng Web.pdf',
        'SOT357' => 'SOT357-Kiểm thử phần mềm.pdf',
        'SOT366' => 'SOT366-Phát triển phần mềm mã nguồn mở.pdf',
        'SOT375' => 'SOT375-Tiếng Anh chuyên ngành (CN thông tin).pdf',
        'SOT379' => 'SOT379-Lập trình thiết bị di động.pdf',
        'SOT380' => 'SOT380-Kiến trúc và thiết kế phần mềm.pdf',
        'SOT381' => 'SOT381-Tin học đại cương A.pdf',
        'SSH313' => 'SSH313-Pháp luật đại cương.pdf',
        'SSH378' => 'SSH378-Tư duy phản biện.pdf',
        'SSH379' => 'SSH379-Ngôn ngữ học thuật.pdf',
        'SSH381' => 'SSH381-Thường thức mỹ thuật.pdf',
        'TRE312' => 'TRE312-Thương mại điện tử (CNTT).pdf',
    ];

    private function jsonResponse(array $payload, int $status = 200): JsonResponse
    {
        return response()->json($payload, $status, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    public function mine(Request $request): JsonResponse
    {
        $student = $this->resolveCurrentStudent($request);

        $assignment = SinhVienChuongTrinh::query()
            ->with([
                'phienBanCtdt.chuongTrinhDaoTao:id,ma_ctdt,ten_ctdt,nganh_dao_tao_id,tong_tin_chi_yeu_cau',
                'phienBanCtdt.chuongTrinhDaoTao.nganhDaoTao:id,ma_nganh,ten_nganh,he_dao_tao,thoi_gian_dao_tao',
            ])
            ->when($student, fn ($query) => $query->where('sinh_vien_id', $student->id))
            ->when(! $student, fn ($query) => $query->whereRaw('1 = 0'))
            ->where('locked', true)
            ->latest('id')
            ->first();

        if (! $assignment?->phienBanCtdt) {
            $fallbackVersion = PhienBanCtdt::query()
                ->with([
                    'chuongTrinhDaoTao:id,ma_ctdt,ten_ctdt,nganh_dao_tao_id,tong_tin_chi_yeu_cau',
                    'chuongTrinhDaoTao.nganhDaoTao:id,ma_nganh,ten_nganh,he_dao_tao,thoi_gian_dao_tao',
                ])
                ->where('trang_thai', 'published')
                ->when($student?->nganh_dao_tao_id, fn ($query) => $query
                    ->whereHas('chuongTrinhDaoTao', fn ($ctdtQuery) => $ctdtQuery
                        ->where('nganh_dao_tao_id', $student?->nganh_dao_tao_id)))
                ->orderByDesc('version_no')
                ->orderByDesc('id')
                ->first();

            if ($fallbackVersion) {
                return $this->jsonResponse([
                    'data' => [
                        'assignment' => null,
                        'curriculum' => $this->curriculumPayload($fallbackVersion, $student),
                        'current_term' => $this->currentTermPayload(),
                    ],
                ]);
            }

            return $this->jsonResponse([
                'message' => 'Chưa có chương trình đào tạo đã công bố để hiển thị.',
                'data' => null,
            ], 404);
        }

        return $this->jsonResponse([
            'data' => [
                'assignment' => $this->assignmentPayload($assignment),
                'curriculum' => $this->curriculumPayload($assignment->phienBanCtdt, $student),
                'current_term' => $this->currentTermPayload(),
            ],
        ]);
    }

    private function resolveCurrentStudent(Request $request): ?SinhVien
    {
        $user = $request->user()?->loadMissing(['student', 'profile']);

        if ($user?->student) {
            return $user->student;
        }

        if ($user?->profile instanceof SinhVien) {
            return $user->profile;
        }

        if ($user?->username) {
            return SinhVien::query()
                ->where('user_id', $user->username)
                ->first();
        }

        return null;
    }

    private function assignmentPayload(SinhVienChuongTrinh $assignment): array
    {
        return [
            'id' => $assignment->id,
            'sinh_vien_id' => $assignment->sinh_vien_id,
            'phien_ban_ctdt_id' => $assignment->phien_ban_ctdt_id,
            'ngay_ap_dung' => $assignment->ngay_ap_dung?->toDateString(),
            'locked' => (bool) $assignment->locked,
            'ghi_chu' => $assignment->ghi_chu,
            'phien_ban_ctdt' => $this->versionPayload($assignment->phienBanCtdt),
            'created_at' => $assignment->created_at,
            'updated_at' => $assignment->updated_at,
        ];
    }

    private function versionPayload(?PhienBanCtdt $version): ?array
    {
        if (! $version) {
            return null;
        }

        return [
            'id' => $version->id,
            'chuong_trinh_dao_tao_id' => $version->chuong_trinh_dao_tao_id,
            'version_no' => $version->version_no,
            'hieu_luc_tu' => $version->hieu_luc_tu?->toDateString(),
            'hieu_luc_den' => $version->hieu_luc_den?->toDateString(),
            'trang_thai' => $version->trang_thai,
            'ghi_chu' => $version->ghi_chu,
            'chuong_trinh_dao_tao' => $version->chuongTrinhDaoTao,
        ];
    }

    private function curriculumPayload(PhienBanCtdt $version, ?SinhVien $student): array
    {
        $hasTimeAllocationColumns = Schema::hasColumn('hoc_phans', 'so_tiet_ly_thuyet')
            && Schema::hasColumn('hoc_phans', 'so_tiet_thuc_hanh');
        $studentResults = $student ? $this->studentResultsByCourse($student) : collect();

        $groups = DB::table('nhom_hoc_phans')
            ->where('phien_ban_ctdt_id', $version->id)
            ->orderBy('thu_tu')
            ->orderBy('id')
            ->get();

        $itemsByGroupId = DB::table('phien_ban_ctdt_hoc_phans as pivot')
            ->join('hoc_phans as hp', 'hp.id', '=', 'pivot.hoc_phan_id')
            ->leftJoin('don_vis as dv', 'dv.id', '=', 'hp.don_vi_id')
            ->leftJoin('chuyen_nganhs as cn', 'cn.id', '=', 'pivot.chuyen_nganh_id')
            ->where('pivot.phien_ban_ctdt_id', $version->id)
            ->select(array_filter([
                'pivot.nhom_hoc_phan_id',
                'pivot.vai_tro',
                'pivot.hoc_ky_goi_y',
                'pivot.ap_dung_cho',
                'pivot.chuyen_nganh_id',
                'hp.id',
                'hp.ma_hoc_phan',
                'hp.ten_hoc_phan',
                'hp.so_tin_chi',
                $hasTimeAllocationColumns ? 'hp.so_tiet_ly_thuyet' : null,
                $hasTimeAllocationColumns ? 'hp.so_tiet_thuc_hanh' : null,
                'hp.loai_hoc_phan',
                'hp.trang_thai',
                'dv.ma_don_vi',
                'dv.ten_don_vi',
                'cn.ma_chuyen_nganh',
                'cn.ten_chuyen_nganh',
            ]))
            ->orderBy('hp.ma_hoc_phan')
            ->get()
            ->groupBy('nhom_hoc_phan_id');

        $groupPayloads = $groups->map(function (object $group) use ($itemsByGroupId, $hasTimeAllocationColumns, $student, $studentResults): array {
            $items = $itemsByGroupId->get($group->id, collect())
                ->map(function (object $item) use ($hasTimeAllocationColumns, $student, $studentResults): array {
                    $result = $studentResults->get($item->id);
                    $plannedTerm = $this->plannedTermForStudent($student, $item->hoc_ky_goi_y !== null ? (int) $item->hoc_ky_goi_y : null);
                    $syllabusUrl = $this->courseSyllabusUrl((string) $item->ma_hoc_phan);

                    return [
                        'id' => $item->id,
                        'ma_hoc_phan' => $item->ma_hoc_phan,
                        'ten_hoc_phan' => $item->ten_hoc_phan,
                        'so_tin_chi' => (int) $item->so_tin_chi,
                        'so_tiet_ly_thuyet' => $hasTimeAllocationColumns && $item->so_tiet_ly_thuyet !== null
                            ? (int) $item->so_tiet_ly_thuyet
                            : null,
                        'so_tiet_thuc_hanh' => $hasTimeAllocationColumns && $item->so_tiet_thuc_hanh !== null
                            ? (int) $item->so_tiet_thuc_hanh
                            : null,
                        'loai_hoc_phan' => $item->loai_hoc_phan,
                        'vai_tro' => $item->vai_tro,
                        'hoc_ky_goi_y' => $item->hoc_ky_goi_y !== null ? (int) $item->hoc_ky_goi_y : null,
                        'nam_hoc_mo' => $plannedTerm['nam_hoc'] ?? null,
                        'hoc_ky_mo' => $plannedTerm['hoc_ky'] ?? null,
                        'nam_hoc_dat' => $result['nam_hoc_dat'] ?? null,
                        'hoc_ky_dat' => $result['hoc_ky_dat'] ?? null,
                        'diem_dat' => $result['diem_dat'] ?? null,
                        'de_cuong_hoc_phan_url' => $syllabusUrl,
                        'tai_lieu_tham_khao_url' => $syllabusUrl,
                        'ap_dung_cho' => $item->ap_dung_cho,
                        'trang_thai' => (bool) $item->trang_thai,
                        'don_vi' => [
                            'ma_don_vi' => $item->ma_don_vi,
                            'ten_don_vi' => $item->ten_don_vi,
                        ],
                        'chuyen_nganh' => $item->chuyen_nganh_id ? [
                            'id' => $item->chuyen_nganh_id,
                            'ma_chuyen_nganh' => $item->ma_chuyen_nganh,
                            'ten_chuyen_nganh' => $item->ten_chuyen_nganh,
                        ] : null,
                    ];
                })
                ->values();

            return [
                'id' => $group->id,
                'ma_nhom' => $group->ma_nhom,
                'ten_nhom' => $group->ten_nhom,
                'min_tin_chi' => (int) $group->min_tin_chi,
                'min_so_mon' => (int) $group->min_so_mon,
                'bat_buoc_toan_bo' => (bool) $group->bat_buoc_toan_bo,
                'thu_tu' => (int) $group->thu_tu,
                'items' => $items,
                'tong_tin_chi' => $items->sum('so_tin_chi'),
            ];
        })->values();

        return [
            ...$this->versionPayload($version),
            'groups' => $groupPayloads,
        ];
    }

    private function courseSyllabusUrl(string $courseCode): ?string
    {
        $fileName = self::DCHP_FILE_BY_COURSE_CODE[$courseCode] ?? null;

        return $fileName ? '/dchp/' . str_replace('%2B', '+', rawurlencode($fileName)) : null;
    }

    private function plannedTermForStudent(?SinhVien $student, ?int $recommendedSemester): ?array
    {
        if (! $student || ! $recommendedSemester) {
            return null;
        }

        $admissionYear = $this->studentAdmissionYear($student);

        if (! $admissionYear) {
            return null;
        }

        $yearOffset = intdiv($recommendedSemester - 1, 2);
        $startYear = $admissionYear + $yearOffset;
        $semester = $recommendedSemester % 2 === 1 ? '1' : '2';

        return [
            'nam_hoc' => $startYear . '-' . ($startYear + 1),
            'hoc_ky' => $semester,
        ];
    }

    private function studentAdmissionYear(SinhVien $student): ?int
    {
        if ($student->nam_nhap_hoc) {
            return (int) $student->nam_nhap_hoc;
        }

        if (preg_match('/(\d{2})/', (string) $student->khoa_hoc, $matches)) {
            return 1958 + (int) $matches[1];
        }

        if (preg_match('/^(\d{2})/', (string) $student->ma_lop, $matches)) {
            return 1958 + (int) $matches[1];
        }

        return null;
    }

    private function studentResultsByCourse(SinhVien $student): \Illuminate\Support\Collection
    {
        if (! Schema::hasTable('ket_qua_hoc_taps')) {
            return collect();
        }

        $hasHocKyId = Schema::hasColumn('ket_qua_hoc_taps', 'hoc_ky_id');

        return DB::table('ket_qua_hoc_taps as kq')
            ->when($hasHocKyId, fn ($query) => $query
                ->leftJoin('hoc_kys as hk', 'hk.id', '=', 'kq.hoc_ky_id')
                ->leftJoin('nam_hocs as nh', 'nh.id', '=', 'hk.nam_hoc_id'))
            ->where('kq.sinh_vien_id', $student->id)
            ->select(array_filter([
                'kq.hoc_phan_id',
                'kq.diem_he_10',
                $hasHocKyId ? 'hk.hoc_ky as hoc_ky_dat' : null,
                $hasHocKyId ? 'nh.nam_hoc as nam_hoc_dat' : null,
            ]))
            ->orderByDesc('kq.lan_hoc')
            ->get()
            ->groupBy('hoc_phan_id')
            ->map(function ($results): array {
                $scores = $results
                    ->pluck('diem_he_10')
                    ->filter(fn ($score) => $score !== null);

                $latest = $results->first();

                return [
                    'diem_dat' => $scores->isNotEmpty()
                        ? round((float) $scores->avg(), 1)
                        : null,
                    'nam_hoc_dat' => $latest->nam_hoc_dat ?? null,
                    'hoc_ky_dat' => isset($latest->hoc_ky_dat) ? (string) $latest->hoc_ky_dat : null,
                ];
            });
    }

    private function currentTermPayload(): ?array
    {
        $term = $this->currentTerm();

        if (! $term) {
            return null;
        }

        $term->loadMissing('namHoc:id,nam_hoc');

        return [
            'id' => $term->id,
            'nam_hoc_id' => $term->nam_hoc_id,
            'nam_hoc' => $term->namHoc?->nam_hoc,
            'hoc_ky' => $term->hoc_ky,
        ];
    }

    private function currentTerm(): ?HocKy
    {
        $currentAcademicTermArray = json_decode((string) (HeThongCauHinh::query()->find('current_academic_term')?->value ?? ''), true);

        if (is_array($currentAcademicTermArray)) {
            $namHoc = $currentAcademicTermArray['nam_hoc'] ?? null;
            $hocKy = $currentAcademicTermArray['hoc_ky'] ?? null;

            if (is_string($namHoc) && $hocKy !== null) {
                $term = HocKy::query()
                    ->where('hoc_ky', (string) $hocKy)
                    ->whereHas('namHoc', fn ($query) => $query->where('nam_hoc', $namHoc))
                    ->first();

                if ($term) {
                    return $term;
                }
            }
        }

        $currentTermId = (int) (HeThongCauHinh::query()->find('current_hoc_ky_id')?->value ?? 0);

        if ($currentTermId <= 0) {
            $currentTermId = (int) (HeThongCauHinh::query()->find('current_academic_term_id')?->value ?? 0);
        }

        return $currentTermId > 0 ? HocKy::query()->find($currentTermId) : null;
    }
}
