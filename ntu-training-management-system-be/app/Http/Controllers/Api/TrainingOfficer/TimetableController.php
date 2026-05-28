<?php

namespace App\Http\Controllers\Api\TrainingOfficer;

use App\Http\Controllers\Controller;
use App\Models\CanBo;
use App\Models\CauHinhTuanHoc;
use App\Models\GiangDuong;
use App\Models\HeThongCauHinh;
use App\Models\HocKy;
use App\Models\HocPhan;
use App\Models\Lop;
use App\Models\LopHocPhan;
use App\Models\LopHocPhanDangKy;
use App\Models\PhongHoc;
use App\Models\ThoiKhoaBieu;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TimetableController extends Controller
{
    private const MAX_PERIODS_PER_DAY = 13;

    private function jsonResponse(array $payload, int $status = 200): JsonResponse
    {
        return response()->json($payload, $status, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    public function index(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'hoc_ky_id' => ['nullable', 'integer', 'exists:hoc_kys,id'],
            'giang_duong_id' => ['nullable', 'integer', 'exists:giang_duongs,id'],
            'phong_hoc_id' => ['nullable', 'integer', 'exists:phong_hocs,id'],
        ]);

        $currentTermId = $this->currentTermId();
        $termId = (int) ($payload['hoc_ky_id'] ?? 0);
        if ($termId <= 0) {
            $termId = $currentTermId;
        }

        $items = ThoiKhoaBieu::query()
            ->with([
                'lopHocPhan:id,hoc_phan_id,hoc_ky_id,lop_hanh_chinh_id,giang_vien_id,ma_hoc_phan,lop_hoc_phan,nhom_hoc_phan,ten_hoc_phan,ten_giang_vien,si_so,updated_at',
                'lopHocPhan.lopHanhChinh:id,lop_hoc_phan,ma_khoi,ten_khoi',
                'phongHoc.giangDuong:id,ma_giang_duong,ten_giang_duong',
                'hocKy.namHoc:id,nam_hoc',
            ])
            ->when($termId > 0, fn ($query) => $query->where('hoc_ky_id', $termId))
            ->when(isset($payload['phong_hoc_id']), fn ($query) => $query->where('phong_hoc_id', $payload['phong_hoc_id']))
            ->when(isset($payload['giang_duong_id']), fn ($query) => $query->whereHas('phongHoc', fn ($roomQuery) => $roomQuery->where('giang_duong_id', $payload['giang_duong_id'])))
            ->orderBy('hoc_ky_id')
            ->orderBy('thu')
            ->orderBy('tiet_bat_dau')
            ->get()
            ->map(fn (ThoiKhoaBieu $item) => $this->timetablePayload($item))
            ->values();

        return $this->jsonResponse(['data' => $items->all()]);
    }

    public function catalogs(): JsonResponse
    {
        return $this->jsonResponse([
            'data' => [
                'giang_duongs' => GiangDuong::query()->orderBy('ma_giang_duong')->get(),
                'phong_hocs' => PhongHoc::query()
                    ->with('giangDuong:id,ma_giang_duong,ten_giang_duong')
                    ->orderBy('ma_phong')
                    ->get(),
                'hoc_phans' => HocPhan::query()
                    ->with('donVi:id,ma_don_vi,ten_don_vi')
                    ->where('trang_thai', true)
                    ->orderBy('ma_hoc_phan')
                    ->get(['id', 'don_vi_id', 'ma_hoc_phan', 'ten_hoc_phan', 'so_tin_chi']),
                'lop_hanh_chinhs' => Lop::query()
                    ->where('trang_thai', true)
                    ->orderBy('lop_hoc_phan')
                    ->get(['id', 'lop_hoc_phan', 'si_so', 'ma_khoi', 'ten_khoi', 'ma_don_vi', 'ten_don_vi']),
                'giang_viens' => CanBo::query()
                    ->orderBy('user_id')
                    ->get(['id', 'user_id', 'ten_giang_vien', 'don_vi_id', 'chuc_vu', 'chuc_danh']),
                'lop_hoc_phans' => LopHocPhan::query()
                    ->with('lopHanhChinh:id,lop_hoc_phan,ma_khoi,ten_khoi')
                    ->where('trang_thai', true)
                    ->orderBy('hoc_ky_id')
                    ->orderBy('lop_hoc_phan')
                    ->get(['id', 'hoc_phan_id', 'hoc_ky_id', 'lop_hanh_chinh_id', 'giang_vien_id', 'ma_hoc_phan', 'lop_hoc_phan', 'nhom_hoc_phan', 'ten_hoc_phan', 'ten_giang_vien', 'si_so']),
                'cau_hinh_tuan_hocs' => CauHinhTuanHoc::query()
                    ->with('hocKy.namHoc:id,nam_hoc')
                    ->orderBy('hoc_ky_id')
                    ->get()
                    ->map(fn (CauHinhTuanHoc $config) => $this->weekConfigPayload($config))
                    ->values(),
            ],
        ]);
    }

    private function currentTermId(): int
    {
        $termId = (int) (HeThongCauHinh::query()->find('current_hoc_ky_id')?->value ?? 0);
        if ($termId <= 0) {
            $termId = (int) (HeThongCauHinh::query()->find('current_academic_term_id')?->value ?? 0);
        }

        return $termId;
    }

    public function storeClassSection(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'hoc_phan_id' => ['required', 'integer', 'exists:hoc_phans,id'],
            'hoc_ky_id' => ['required', 'integer', 'exists:hoc_kys,id'],
            'lop_hanh_chinh_id' => ['nullable', 'integer', 'exists:lops,id'],
            'lop_hoc_phan' => [
                'required',
                'string',
                'max:255',
            ],
            'nhom_hoc_phan' => ['required', 'string', 'max:50'],
            'ten_giang_vien' => ['nullable', 'string', 'max:255'],
            'giang_vien_id' => ['nullable', 'integer', 'exists:can_bos,id'],
            'si_so' => ['required', 'integer', 'min:1', 'max:1000'],
        ]);

        $course = HocPhan::query()->findOrFail($payload['hoc_phan_id']);
        $lecturer = isset($payload['giang_vien_id'])
            ? CanBo::query()->find($payload['giang_vien_id'])
            : null;

        if ($course->don_vi_id && $lecturer && (int) $lecturer->don_vi_id !== (int) $course->don_vi_id) {
            abort(response()->json([
                'message' => 'Giảng viên được chọn không thuộc đơn vị quản lý học phần này.',
            ], 422, [], JSON_UNESCAPED_UNICODE));
        }

        $sectionCode = Str::upper(trim($payload['lop_hoc_phan']));
        $classGroup = $this->normalizeClassGroup((string) $payload['nhom_hoc_phan']);

        if ($sectionCode === '' || $classGroup === '') {
            abort(response()->json([
                'message' => 'Vui lòng nhập lớp học phần và nhóm học phần.',
            ], 422, [], JSON_UNESCAPED_UNICODE));
        }

        $hasDuplicateGroup = LopHocPhan::query()
            ->where('hoc_ky_id', (int) $payload['hoc_ky_id'])
            ->where('hoc_phan_id', $course->id)
            ->whereRaw('LOWER(nhom_hoc_phan) = ?', [Str::lower($classGroup)])
            ->whereRaw('LOWER(lop_hoc_phan) <> ?', [Str::lower($sectionCode)])
            ->exists();

        if ($hasDuplicateGroup) {
            abort(response()->json([
                'message' => "Mã học phần {$course->ma_hoc_phan} đã có nhóm học phần {$classGroup}. Vui lòng nhập nhóm khác.",
            ], 422, [], JSON_UNESCAPED_UNICODE));
        }

        $hasDuplicateSection = LopHocPhan::query()
            ->where('hoc_ky_id', (int) $payload['hoc_ky_id'])
            ->where('hoc_phan_id', $course->id)
            ->whereRaw('LOWER(lop_hoc_phan) = ?', [Str::lower($sectionCode)])
            ->whereRaw('LOWER(nhom_hoc_phan) <> ?', [Str::lower($classGroup)])
            ->exists();

        if ($hasDuplicateSection) {
            abort(response()->json([
                'message' => "Mã học phần {$course->ma_hoc_phan} đã có lớp học phần \"{$sectionCode}\". Một môn học không thể có 2 lớp học phần cùng tên. Vui lòng nhập tên lớp khác.",
            ], 422, [], JSON_UNESCAPED_UNICODE));
        }

        $newLecturerId = $lecturer?->id;
        $newLecturerName = $lecturer?->ten_giang_vien ?: (trim((string) ($payload['ten_giang_vien'] ?? '')) ?: null);

        $existingSection = LopHocPhan::query()
            ->where('hoc_ky_id', (int) $payload['hoc_ky_id'])
            ->where('hoc_phan_id', $course->id)
            ->whereRaw('LOWER(nhom_hoc_phan) = ?', [Str::lower($classGroup)])
            ->whereRaw('LOWER(lop_hoc_phan) = ?', [Str::lower($sectionCode)])
            ->first();

        if ($existingSection && ($newLecturerId || $newLecturerName)) {
            $lecturerChanged = ($existingSection->giang_vien_id !== $newLecturerId) || ($existingSection->ten_giang_vien !== $newLecturerName);
            if ($lecturerChanged) {
                $slots = ThoiKhoaBieu::query()->where('lop_hoc_phan_id', $existingSection->id)->get();
                foreach ($slots as $slot) {
                    $conflict = ThoiKhoaBieu::query()
                        ->with(['lopHocPhan:id,lop_hoc_phan,ten_hoc_phan,ten_giang_vien,giang_vien_id', 'phongHoc:id,ma_phong'])
                        ->whereKeyNot($slot->id)
                        ->where('hoc_ky_id', $slot->hoc_ky_id)
                        ->where('thu', $slot->thu)
                        ->where('tiet_bat_dau', '<=', $slot->tiet_ket_thuc)
                        ->where('tiet_ket_thuc', '>=', $slot->tiet_bat_dau)
                        ->where('tuan_bat_dau', '<=', $slot->tuan_ket_thuc)
                        ->where('tuan_ket_thuc', '>=', $slot->tuan_bat_dau)
                        ->where(function ($query) use ($newLecturerId, $newLecturerName) {
                            if ($newLecturerId) {
                                $query->where('giang_vien_id_snapshot', $newLecturerId)
                                    ->orWhereHas('lopHocPhan', fn ($classQuery) => $classQuery->where('giang_vien_id', $newLecturerId));
                            }

                            if ($newLecturerName) {
                                    $query->when($newLecturerId, fn ($nameQuery) => $nameQuery->orWhere(function ($nested) use ($newLecturerName) {
                                        $nested->where('ten_giang_vien_snapshot', $newLecturerName)
                                            ->orWhereHas('lopHocPhan', fn ($classQuery) => $classQuery->where('ten_giang_vien', $newLecturerName));
                                    }), fn ($nameQuery) => $nameQuery
                                        ->where('ten_giang_vien_snapshot', $newLecturerName)
                                        ->orWhereHas('lopHocPhan', fn ($classQuery) => $classQuery->where('ten_giang_vien', $newLecturerName)));
                            }
                        })
                        ->first();

                    if ($conflict) {
                        $teacher = $newLecturerName ?: 'này';
                        abort(response()->json([
                            'message' => "Không thể đổi giảng viên. Giảng viên {$teacher} đã có lịch dạy lớp {$conflict->lopHocPhan?->lop_hoc_phan} trong thời gian trùng khớp (Thứ {$slot->thu}, tiết {$slot->tiet_bat_dau}-{$slot->tiet_ket_thuc}, tuần {$slot->tuan_bat_dau}-{$slot->tuan_ket_thuc}).",
                        ], 422, [], JSON_UNESCAPED_UNICODE));
                    }
                }
            }
        }

        $section = LopHocPhan::query()->updateOrCreate([
            'hoc_ky_id' => (int) $payload['hoc_ky_id'],
            'hoc_phan_id' => $course->id,
            'nhom_hoc_phan' => $classGroup,
            'lop_hoc_phan' => $sectionCode,
        ], [
            'lop_hanh_chinh_id' => isset($payload['lop_hanh_chinh_id']) ? (int) $payload['lop_hanh_chinh_id'] : null,
            'giang_vien_id' => $newLecturerId,
            'ma_hoc_phan' => $course->ma_hoc_phan,
            'ten_hoc_phan' => $course->ten_hoc_phan,
            'nhom_hoc_phan' => $classGroup,
            'ten_giang_vien' => $newLecturerName,
            'si_so' => (int) $payload['si_so'],
            'trang_thai' => true,
        ]);

        ThoiKhoaBieu::query()
            ->where('lop_hoc_phan_id', $section->id)
            ->update([
                'giang_vien_id_snapshot' => $section->giang_vien_id,
                'ten_giang_vien_snapshot' => $section->ten_giang_vien,
            ]);

        LopHocPhanDangKy::query()->updateOrCreate([
            'hoc_ky_id' => (int) $payload['hoc_ky_id'],
            'lop_hoc_phan_id' => $section->id,
        ], [
            'si_so_toi_da' => max(0, (int) $payload['si_so']),
            'status' => 'open',
        ]);

        return $this->jsonResponse([
            'message' => 'Đã tạo lớp học phần.',
            'data' => $section,
        ], 201);
    }

    private function normalizeClassGroup(string $value): string
    {
        $trimmed = trim($value);

        if (preg_match('/^\d+$/', $trimmed) === 1) {
            return str_pad($trimmed, 2, '0', STR_PAD_LEFT);
        }

        return Str::upper($trimmed);
    }

    public function storeBuilding(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'ma_giang_duong' => ['required', 'string', 'max:50', 'unique:giang_duongs,ma_giang_duong'],
            'ten_giang_duong' => ['required', 'string', 'max:255'],
            'mo_ta' => ['nullable', 'string', 'max:500'],
        ]);

        $building = GiangDuong::query()->create([
            'ma_giang_duong' => trim($payload['ma_giang_duong']),
            'ten_giang_duong' => trim($payload['ten_giang_duong']),
            'mo_ta' => isset($payload['mo_ta']) ? trim((string) $payload['mo_ta']) : null,
        ]);

        return $this->jsonResponse(['message' => 'Đã tạo giảng đường.', 'data' => $building], 201);
    }

    public function updateBuilding(Request $request, GiangDuong $giangDuong): JsonResponse
    {
        $payload = $request->validate([
            'ma_giang_duong' => ['required', 'string', 'max:50', Rule::unique('giang_duongs', 'ma_giang_duong')->ignore($giangDuong->id)],
            'ten_giang_duong' => ['required', 'string', 'max:255'],
            'mo_ta' => ['nullable', 'string', 'max:500'],
        ]);

        $giangDuong->fill([
            'ma_giang_duong' => trim($payload['ma_giang_duong']),
            'ten_giang_duong' => trim($payload['ten_giang_duong']),
            'mo_ta' => isset($payload['mo_ta']) ? trim((string) $payload['mo_ta']) : null,
        ])->save();

        return $this->jsonResponse(['message' => 'Đã cập nhật giảng đường.', 'data' => $giangDuong]);
    }

    public function deleteBuilding(GiangDuong $giangDuong): JsonResponse
    {
        $giangDuong->delete();

        return $this->jsonResponse(['message' => 'Đã xóa giảng đường.']);
    }

    public function storeRoom(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'giang_duong_id' => ['required', 'integer', 'exists:giang_duongs,id'],
            'ma_phong' => ['required', 'string', 'max:50', 'unique:phong_hocs,ma_phong'],
        ]);

        $room = PhongHoc::query()->create([
            'giang_duong_id' => (int) $payload['giang_duong_id'],
            'ma_phong' => trim($payload['ma_phong']),
        ])->load('giangDuong:id,ma_giang_duong,ten_giang_duong');

        return $this->jsonResponse(['message' => 'Đã tạo phòng học.', 'data' => $room], 201);
    }

    public function updateRoom(Request $request, PhongHoc $phongHoc): JsonResponse
    {
        $payload = $request->validate([
            'giang_duong_id' => ['required', 'integer', 'exists:giang_duongs,id'],
            'ma_phong' => ['required', 'string', 'max:50', Rule::unique('phong_hocs', 'ma_phong')->ignore($phongHoc->id)],
        ]);

        $phongHoc->fill([
            'giang_duong_id' => (int) $payload['giang_duong_id'],
            'ma_phong' => trim($payload['ma_phong']),
        ])->save();

        return $this->jsonResponse(['message' => 'Đã cập nhật phòng học.', 'data' => $phongHoc->fresh('giangDuong:id,ma_giang_duong,ten_giang_duong')]);
    }

    public function deleteRoom(PhongHoc $phongHoc): JsonResponse
    {
        $phongHoc->delete();

        return $this->jsonResponse(['message' => 'Đã xóa phòng học.']);
    }

    public function saveWeekConfig(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'hoc_ky_id' => ['required', 'integer', 'exists:hoc_kys,id'],
            'tuan_1_bat_dau' => ['required', 'date_format:Y-m-d', 'regex:/^\d{4}-\d{2}-\d{2}$/'],
            'so_tuan_mac_dinh' => ['required', 'integer', 'min:1', 'max:52'],
            'tuan_nghis' => ['nullable', 'array'],
            'tuan_nghis.*' => ['integer', 'min:1', 'max:52'],
        ]);

        $currentConfig = CauHinhTuanHoc::query()->where('hoc_ky_id', $payload['hoc_ky_id'])->first();
        $rawBreakWeeks = array_key_exists('tuan_nghis', $payload)
            ? ($payload['tuan_nghis'] ?? [])
            : ($currentConfig?->tuan_nghis ?? []);

        $breakWeeks = collect($rawBreakWeeks)
            ->map(fn ($week) => (int) $week)
            ->filter(fn ($week) => $week >= 1 && $week <= (int) $payload['so_tuan_mac_dinh'])
            ->unique()
            ->sort()
            ->values()
            ->all();

        $config = CauHinhTuanHoc::query()->updateOrCreate(
            ['hoc_ky_id' => (int) $payload['hoc_ky_id']],
            [
                'tuan_1_bat_dau' => $payload['tuan_1_bat_dau'],
                'so_tuan_mac_dinh' => (int) $payload['so_tuan_mac_dinh'],
                'tuan_nghis' => $breakWeeks,
            ],
        )->load('hocKy.namHoc:id,nam_hoc');

        return $this->jsonResponse(['message' => 'Đã lưu cấu hình tuần học.', 'data' => $this->weekConfigPayload($config)]);
    }

    public function saveBreakWeeks(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'hoc_ky_id' => ['required', 'integer', 'exists:hoc_kys,id'],
            'tuan_nghis' => ['nullable', 'array'],
            'tuan_nghis.*' => ['integer', 'min:1', 'max:52'],
        ]);

        $config = CauHinhTuanHoc::query()->where('hoc_ky_id', $payload['hoc_ky_id'])->first();
        if (! $config) {
            abort(response()->json([
                'message' => 'Vui lòng cấu hình ngày bắt đầu tuần 1 cho học kỳ trước khi đánh dấu tuần nghỉ.',
            ], 422, [], JSON_UNESCAPED_UNICODE));
        }

        $breakWeeks = collect($payload['tuan_nghis'] ?? [])
            ->map(fn ($week) => (int) $week)
            ->filter(fn ($week) => $week >= 1 && $week <= $config->so_tuan_mac_dinh)
            ->unique()
            ->sort()
            ->values()
            ->all();

        $config->fill(['tuan_nghis' => $breakWeeks])->save();

        return $this->jsonResponse([
            'message' => 'Đã lưu tuần nghỉ.',
            'data' => $this->weekConfigPayload($config->fresh('hocKy.namHoc:id,nam_hoc')),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $payload = $this->validateTimetable($request);
        $this->assertClassSectionMatchesTerm($payload);
        $computed = $this->computeTimetableFields($payload);
        $this->assertNoRoomConflict($payload, $computed);
        $this->assertNoLecturerConflict($payload, $computed);
        $snapshot = $this->timetableSnapshot($payload);

        $item = ThoiKhoaBieu::query()->create([
            ...$payload,
            ...$computed,
            ...$snapshot,
            'created_by' => (string) ($request->user()?->username ?? ''),
        ]);

        return $this->jsonResponse([
            'message' => 'Đã xếp thời khóa biểu.',
            'data' => $this->timetablePayload($item->load(['lopHocPhan.lopHanhChinh', 'phongHoc.giangDuong', 'hocKy.namHoc'])),
        ], 201);
    }

    public function update(Request $request, int|string $thoiKhoaBieu): JsonResponse
    {
        $thoiKhoaBieu = ThoiKhoaBieu::query()->find($thoiKhoaBieu);

        if (! $thoiKhoaBieu) {
            return $this->jsonResponse(['message' => 'Lịch học này không còn tồn tại. Vui lòng tải lại danh sách.'], 404);
        }

        $payload = $this->validateTimetable($request);
        $this->assertClassSectionMatchesTerm($payload);
        $computed = $this->computeTimetableFields($payload);
        $this->assertNoRoomConflict($payload, $computed, $thoiKhoaBieu->id);
        $this->assertNoLecturerConflict($payload, $computed, $thoiKhoaBieu->id);
        $snapshot = $this->timetableSnapshot($payload);

        $thoiKhoaBieu->fill([...$payload, ...$computed, ...$snapshot])->save();

        return $this->jsonResponse([
            'message' => 'Đã cập nhật thời khóa biểu.',
            'data' => $this->timetablePayload($thoiKhoaBieu->fresh(['lopHocPhan.lopHanhChinh', 'phongHoc.giangDuong', 'hocKy.namHoc'])),
        ]);
    }

    public function destroy(int|string $thoiKhoaBieu): JsonResponse
    {
        $thoiKhoaBieu = ThoiKhoaBieu::query()->find($thoiKhoaBieu);

        if (! $thoiKhoaBieu) {
            return $this->jsonResponse(['message' => 'Lịch học này đã được xóa hoặc không còn tồn tại.'], 404);
        }

        $thoiKhoaBieu->delete();

        return $this->jsonResponse(['message' => 'Đã xóa lịch học.']);
    }

    private function validateTimetable(Request $request): array
    {
        return $request->validate([
            'lop_hoc_phan_id' => ['required', 'integer', 'exists:lop_hoc_phans,id'],
            'phong_hoc_id' => ['required', 'integer', 'exists:phong_hocs,id'],
            'hoc_ky_id' => ['required', 'integer', 'exists:hoc_kys,id'],
            'thu' => ['required', 'integer', 'min:2', 'max:8'],
            'tiet_bat_dau' => ['required', 'integer', 'min:1', 'max:' . self::MAX_PERIODS_PER_DAY],
            'so_tiet' => ['required', 'integer', 'min:1', 'max:' . self::MAX_PERIODS_PER_DAY],
            'tuan_bat_dau' => ['required', 'integer', 'min:1', 'max:52'],
            'so_tuan' => ['required', 'integer', 'min:1', 'max:52'],
        ]);
    }

    private function computeTimetableFields(array $payload): array
    {
        $periodEnd = (int) $payload['tiet_bat_dau'] + (int) $payload['so_tiet'] - 1;
        if ($periodEnd > self::MAX_PERIODS_PER_DAY) {
            abort(response()->json(['message' => 'Một ngày chỉ có tối đa 13 tiết.'], 422, [], JSON_UNESCAPED_UNICODE));
        }

        $weekEnd = (int) $payload['tuan_bat_dau'] + (int) $payload['so_tuan'] - 1;
        $config = CauHinhTuanHoc::query()->where('hoc_ky_id', $payload['hoc_ky_id'])->first();
        if (! $config) {
            abort(response()->json(['message' => 'Vui lòng cấu hình ngày bắt đầu tuần 1 cho học kỳ trước khi xếp lịch.'], 422, [], JSON_UNESCAPED_UNICODE));
        }

        if ($weekEnd > $config->so_tuan_mac_dinh) {
            abort(response()->json(['message' => 'Tuần kết thúc vượt quá số tuần mặc định của học kỳ.'], 422, [], JSON_UNESCAPED_UNICODE));
        }

        return [
            'tiet_ket_thuc' => $periodEnd,
            'tuan_ket_thuc' => $weekEnd,
        ];
    }

    private function assertNoRoomConflict(array $payload, array $computed, ?int $ignoreId = null): void
    {
        $conflict = ThoiKhoaBieu::query()
            ->with(['lopHocPhan:id,lop_hoc_phan,ten_hoc_phan,ten_giang_vien', 'phongHoc:id,ma_phong'])
            ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
            ->where('hoc_ky_id', $payload['hoc_ky_id'])
            ->where('phong_hoc_id', $payload['phong_hoc_id'])
            ->where('thu', $payload['thu'])
            ->where('tiet_bat_dau', '<=', $computed['tiet_ket_thuc'])
            ->where('tiet_ket_thuc', '>=', $payload['tiet_bat_dau'])
            ->where('tuan_bat_dau', '<=', $computed['tuan_ket_thuc'])
            ->where('tuan_ket_thuc', '>=', $payload['tuan_bat_dau'])
            ->first();

        if ($conflict) {
            abort(response()->json([
                'message' => "Phòng {$conflict->phongHoc?->ma_phong} đã có lịch {$conflict->lopHocPhan?->lop_hoc_phan} trong khoảng thứ, tiết và tuần này.",
            ], 422, [], JSON_UNESCAPED_UNICODE));
        }
    }

    private function assertNoLecturerConflict(array $payload, array $computed, ?int $ignoreId = null): void
    {
        $class = LopHocPhan::query()->find($payload['lop_hoc_phan_id']);
        $lecturerId = $class?->giang_vien_id;
        $lecturerName = trim((string) ($class?->ten_giang_vien ?? ''));

        if (! $lecturerId && $lecturerName === '') {
            return;
        }

        $conflict = ThoiKhoaBieu::query()
            ->with(['lopHocPhan:id,lop_hoc_phan,ten_hoc_phan,ten_giang_vien,giang_vien_id', 'phongHoc:id,ma_phong'])
            ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
            ->where('hoc_ky_id', $payload['hoc_ky_id'])
            ->where('thu', $payload['thu'])
            ->where('tiet_bat_dau', '<=', $computed['tiet_ket_thuc'])
            ->where('tiet_ket_thuc', '>=', $payload['tiet_bat_dau'])
            ->where('tuan_bat_dau', '<=', $computed['tuan_ket_thuc'])
            ->where('tuan_ket_thuc', '>=', $payload['tuan_bat_dau'])
            ->where(function ($query) use ($lecturerId, $lecturerName) {
                if ($lecturerId) {
                    $query->where('giang_vien_id_snapshot', $lecturerId)
                        ->orWhereHas('lopHocPhan', fn ($classQuery) => $classQuery->where('giang_vien_id', $lecturerId));
                }

                if ($lecturerName !== '') {
                    $query->when($lecturerId, fn ($nameQuery) => $nameQuery->orWhere(function ($nested) use ($lecturerName) {
                        $nested->where('ten_giang_vien_snapshot', $lecturerName)
                            ->orWhereHas('lopHocPhan', fn ($classQuery) => $classQuery->where('ten_giang_vien', $lecturerName));
                    }), fn ($nameQuery) => $nameQuery
                        ->where('ten_giang_vien_snapshot', $lecturerName)
                        ->orWhereHas('lopHocPhan', fn ($classQuery) => $classQuery->where('ten_giang_vien', $lecturerName)));
                }
            })
            ->first();

        if ($conflict) {
            $teacher = $class?->ten_giang_vien ?: $conflict->ten_giang_vien_snapshot ?: $conflict->lopHocPhan?->ten_giang_vien;

            abort(response()->json([
                'message' => "Giảng viên {$teacher} đã có lịch dạy lớp {$conflict->lopHocPhan?->lop_hoc_phan} trong khoảng thứ, tiết và tuần này.",
            ], 422, [], JSON_UNESCAPED_UNICODE));
        }
    }

    private function assertClassSectionMatchesTerm(array $payload): void
    {
        $class = LopHocPhan::query()->find($payload['lop_hoc_phan_id']);

        if ($class && $class->hoc_ky_id !== (int) $payload['hoc_ky_id']) {
            abort(response()->json([
                'message' => 'Lớp học phần không thuộc học kỳ đã chọn.',
            ], 422, [], JSON_UNESCAPED_UNICODE));
        }
    }

    private function timetableSnapshot(array $payload): array
    {
        $class = LopHocPhan::query()->find($payload['lop_hoc_phan_id']);
        $room = PhongHoc::query()->find($payload['phong_hoc_id']);

        return [
            'ma_hoc_phan_snapshot' => $class?->ma_hoc_phan,
            'ten_hoc_phan_snapshot' => $class?->ten_hoc_phan,
            'lop_hoc_phan_snapshot' => $class?->lop_hoc_phan,
            'nhom_hoc_phan_snapshot' => $class?->nhom_hoc_phan,
            'ten_giang_vien_snapshot' => $class?->ten_giang_vien,
            'giang_vien_id_snapshot' => $class?->giang_vien_id,
            'si_so_snapshot' => $class?->si_so,
            'ma_phong_snapshot' => $room?->ma_phong,
        ];
    }

    private function timetablePayload(ThoiKhoaBieu $item): array
    {
        $item->loadMissing(['lopHocPhan.lopHanhChinh', 'phongHoc.giangDuong', 'hocKy.namHoc']);
        $dates = $this->computedDates($item);
        $classRegistration = LopHocPhanDangKy::query()
            ->withCount(['dangKys as so_sv_da_dk' => fn ($query) => $query->where('status', 'registered')])
            ->where('hoc_ky_id', $item->hoc_ky_id)
            ->where('lop_hoc_phan_id', $item->lop_hoc_phan_id)
            ->first();

        if (
            $classRegistration
            && $item->lopHocPhan
            && $item->lopHocPhan->updated_at
            && $classRegistration->updated_at
            && $classRegistration->updated_at->lt($item->lopHocPhan->updated_at)
        ) {
            $classRegistration->fill([
                'si_so_toi_da' => max(0, (int) $item->lopHocPhan->si_so),
            ])->save();
        }

        $classPayload = $item->lopHocPhan ?: [
            'id' => $item->lop_hoc_phan_id,
            'hoc_phan_id' => null,
            'hoc_ky_id' => $item->hoc_ky_id,
            'lop_hanh_chinh_id' => null,
            'giang_vien_id' => $item->giang_vien_id_snapshot,
            'ma_hoc_phan' => $item->ma_hoc_phan_snapshot,
            'lop_hoc_phan' => $item->lop_hoc_phan_snapshot,
            'nhom_hoc_phan' => $item->nhom_hoc_phan_snapshot,
            'ten_hoc_phan' => $item->ten_hoc_phan_snapshot,
            'ten_giang_vien' => $item->ten_giang_vien_snapshot,
            'si_so' => $item->si_so_snapshot,
            'da_xoa_lop_hoc_phan' => true,
        ];
        $roomPayload = $item->phongHoc ?: [
            'id' => $item->phong_hoc_id,
            'giang_duong_id' => null,
            'ma_phong' => $item->ma_phong_snapshot,
            'da_xoa_phong_hoc' => true,
        ];

        return [
            'id' => $item->id,
            'lop_hoc_phan_id' => $item->lop_hoc_phan_id,
            'phong_hoc_id' => $item->phong_hoc_id,
            'hoc_ky_id' => $item->hoc_ky_id,
            'thu' => $item->thu,
            'tiet_bat_dau' => $item->tiet_bat_dau,
            'so_tiet' => $item->so_tiet,
            'tiet_ket_thuc' => $item->tiet_ket_thuc,
            'tuan_bat_dau' => $item->tuan_bat_dau,
            'so_tuan' => $item->so_tuan,
            'tuan_ket_thuc' => $item->tuan_ket_thuc,
            'ngay_bat_dau' => $dates['ngay_bat_dau'],
            'ngay_ket_thuc' => $dates['ngay_ket_thuc'],
            'si_so_toi_da' => $classRegistration?->si_so_toi_da,
            'so_sv_da_dk' => (int) ($classRegistration?->so_sv_da_dk ?? 0),
            'lop_hoc_phan' => $classPayload,
            'phong_hoc' => $roomPayload,
            'hoc_ky' => $item->hocKy ? [
                'id' => $item->hocKy->id,
                'hoc_ky' => $item->hocKy->hoc_ky,
                'nam_hoc' => $item->hocKy->namHoc?->nam_hoc,
            ] : null,
        ];
    }

    private function weekConfigPayload(CauHinhTuanHoc $config): array
    {
        $config->loadMissing('hocKy.namHoc:id,nam_hoc');

        return [
            'id' => $config->id,
            'hoc_ky_id' => $config->hoc_ky_id,
            'tuan_1_bat_dau' => $config->tuan_1_bat_dau?->toDateString(),
            'so_tuan_mac_dinh' => $config->so_tuan_mac_dinh,
            'tuan_nghis' => collect($config->tuan_nghis ?? [])->map(fn ($week) => (int) $week)->values()->all(),
            'hoc_ky' => $config->hocKy ? [
                'id' => $config->hocKy->id,
                'hoc_ky' => $config->hocKy->hoc_ky,
                'nam_hoc' => $config->hocKy->namHoc?->nam_hoc,
            ] : null,
        ];
    }

    private function computedDates(ThoiKhoaBieu $item): array
    {
        $config = CauHinhTuanHoc::query()->where('hoc_ky_id', $item->hoc_ky_id)->first();
        if (! $config) {
            return ['ngay_bat_dau' => null, 'ngay_ket_thuc' => null];
        }

        $firstDate = Carbon::parse($config->tuan_1_bat_dau)
            ->addWeeks($item->tuan_bat_dau - 1)
            ->addDays($item->thu - 2);

        return [
            'ngay_bat_dau' => $firstDate->toDateString(),
            'ngay_ket_thuc' => $firstDate->copy()->addWeeks($item->so_tuan - 1)->toDateString(),
        ];
    }
}
