<?php

namespace App\Http\Controllers\Api\TrainingOfficer;

use App\Http\Controllers\Controller;
use App\Models\CauHinhTuanHoc;
use App\Models\GiangDuong;
use App\Models\HocKy;
use App\Models\Lop;
use App\Models\PhongHoc;
use App\Models\ThoiKhoaBieu;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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

        $items = ThoiKhoaBieu::query()
            ->with([
                'lopHocPhan:id,lop_hoc_phan,ten_hoc_phan,ten_giang_vien,si_so,ma_khoi,ten_khoi',
                'phongHoc.giangDuong:id,ma_giang_duong,ten_giang_duong',
                'hocKy.namHoc:id,nam_hoc',
            ])
            ->when(isset($payload['hoc_ky_id']), fn ($query) => $query->where('hoc_ky_id', $payload['hoc_ky_id']))
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
                'lop_hoc_phans' => Lop::query()
                    ->where('trang_thai', true)
                    ->orderBy('lop_hoc_phan')
                    ->get(['id', 'lop_hoc_phan', 'ten_hoc_phan', 'ten_giang_vien', 'si_so', 'ma_khoi', 'ten_khoi']),
                'cau_hinh_tuan_hocs' => CauHinhTuanHoc::query()
                    ->with('hocKy.namHoc:id,nam_hoc')
                    ->orderBy('hoc_ky_id')
                    ->get()
                    ->map(fn (CauHinhTuanHoc $config) => $this->weekConfigPayload($config))
                    ->values(),
            ],
        ]);
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
            'suc_chua' => ['required', 'integer', 'min:1', 'max:1000'],
        ]);

        $room = PhongHoc::query()->create([
            'giang_duong_id' => (int) $payload['giang_duong_id'],
            'ma_phong' => trim($payload['ma_phong']),
            'suc_chua' => (int) $payload['suc_chua'],
        ])->load('giangDuong:id,ma_giang_duong,ten_giang_duong');

        return $this->jsonResponse(['message' => 'Đã tạo phòng học.', 'data' => $room], 201);
    }

    public function updateRoom(Request $request, PhongHoc $phongHoc): JsonResponse
    {
        $payload = $request->validate([
            'giang_duong_id' => ['required', 'integer', 'exists:giang_duongs,id'],
            'ma_phong' => ['required', 'string', 'max:50', Rule::unique('phong_hocs', 'ma_phong')->ignore($phongHoc->id)],
            'suc_chua' => ['required', 'integer', 'min:1', 'max:1000'],
        ]);

        $phongHoc->fill([
            'giang_duong_id' => (int) $payload['giang_duong_id'],
            'ma_phong' => trim($payload['ma_phong']),
            'suc_chua' => (int) $payload['suc_chua'],
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
        ]);

        $config = CauHinhTuanHoc::query()->updateOrCreate(
            ['hoc_ky_id' => (int) $payload['hoc_ky_id']],
            [
                'tuan_1_bat_dau' => $payload['tuan_1_bat_dau'],
                'so_tuan_mac_dinh' => (int) $payload['so_tuan_mac_dinh'],
            ],
        )->load('hocKy.namHoc:id,nam_hoc');

        return $this->jsonResponse(['message' => 'Đã lưu cấu hình tuần học.', 'data' => $this->weekConfigPayload($config)]);
    }

    public function store(Request $request): JsonResponse
    {
        $payload = $this->validateTimetable($request);
        $computed = $this->computeTimetableFields($payload);
        $this->assertNoRoomConflict($payload, $computed);
        $this->assertCapacity($payload);

        $item = ThoiKhoaBieu::query()->create([
            ...$payload,
            ...$computed,
            'created_by' => (string) ($request->user()?->username ?? ''),
        ]);

        return $this->jsonResponse([
            'message' => 'Đã xếp thời khóa biểu.',
            'data' => $this->timetablePayload($item->load(['lopHocPhan', 'phongHoc.giangDuong', 'hocKy.namHoc'])),
        ], 201);
    }

    public function update(Request $request, ThoiKhoaBieu $thoiKhoaBieu): JsonResponse
    {
        $payload = $this->validateTimetable($request);
        $computed = $this->computeTimetableFields($payload);
        $this->assertNoRoomConflict($payload, $computed, $thoiKhoaBieu->id);
        $this->assertCapacity($payload);

        $thoiKhoaBieu->fill([...$payload, ...$computed])->save();

        return $this->jsonResponse([
            'message' => 'Đã cập nhật thời khóa biểu.',
            'data' => $this->timetablePayload($thoiKhoaBieu->fresh(['lopHocPhan', 'phongHoc.giangDuong', 'hocKy.namHoc'])),
        ]);
    }

    public function destroy(ThoiKhoaBieu $thoiKhoaBieu): JsonResponse
    {
        $thoiKhoaBieu->delete();

        return $this->jsonResponse(['message' => 'Đã xóa lịch học.']);
    }

    private function validateTimetable(Request $request): array
    {
        return $request->validate([
            'lop_hoc_phan_id' => ['required', 'integer', 'exists:lops,id'],
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

    private function assertCapacity(array $payload): void
    {
        $class = Lop::query()->find($payload['lop_hoc_phan_id']);
        $room = PhongHoc::query()->find($payload['phong_hoc_id']);

        if ($class && $room && $class->si_so > 0 && $room->suc_chua < $class->si_so) {
            abort(response()->json([
                'message' => "Phòng {$room->ma_phong} không đủ sức chứa cho lớp {$class->lop_hoc_phan}.",
            ], 422, [], JSON_UNESCAPED_UNICODE));
        }
    }

    private function timetablePayload(ThoiKhoaBieu $item): array
    {
        $item->loadMissing(['lopHocPhan', 'phongHoc.giangDuong', 'hocKy.namHoc']);
        $dates = $this->computedDates($item);

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
            'lop_hoc_phan' => $item->lopHocPhan,
            'phong_hoc' => $item->phongHoc,
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
