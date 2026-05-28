<?php

namespace App\Http\Controllers\Api\Lecturer\Timetable;

use App\Http\Controllers\Controller;
use App\Models\CanBo;
use App\Models\CauHinhTuanHoc;
use App\Models\DangKyHocPhan;
use App\Models\HeThongCauHinh;
use App\Models\LopHocPhan;
use App\Models\ThoiKhoaBieu;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LecturerTimetableController extends Controller
{
    private const MAX_PERIODS_PER_DAY = 13;

    public function index(Request $request): JsonResponse
    {
        $lecturer = $this->currentLecturer($request);
        $payload = $request->validate([
            'hoc_ky_id' => ['nullable', 'integer', 'exists:hoc_kys,id'],
            'lop_hoc_phan_id' => ['nullable', 'integer', 'exists:lop_hoc_phans,id'],
        ]);

        $termId = (int) ($payload['hoc_ky_id'] ?? $this->currentTermId());
        $classId = (int) ($payload['lop_hoc_phan_id'] ?? 0);

        $classes = LopHocPhan::query()
            ->with('hocPhan:id,so_tin_chi')
            ->where('giang_vien_id', $lecturer->id)
            ->when($termId > 0, fn ($query) => $query->where('hoc_ky_id', $termId))
            ->orderBy('ma_hoc_phan')
            ->orderBy('nhom_hoc_phan')
            ->get(['id', 'hoc_phan_id', 'hoc_ky_id', 'ma_hoc_phan', 'ten_hoc_phan', 'lop_hoc_phan', 'nhom_hoc_phan', 'si_so']);

        $timetableItems = ThoiKhoaBieu::query()
            ->with([
                'lopHocPhan.hocPhan:id,so_tin_chi',
                'phongHoc:id,ma_phong',
                'hocKy.namHoc:id,nam_hoc',
            ])
            ->whereHas('lopHocPhan', fn ($query) => $query->where('giang_vien_id', $lecturer->id))
            ->when($termId > 0, fn ($query) => $query->where('hoc_ky_id', $termId))
            ->when($classId > 0, fn ($query) => $query->where('lop_hoc_phan_id', $classId))
            ->orderBy('thu')
            ->orderBy('tiet_bat_dau')
            ->get();

        $registeredCounts = DangKyHocPhan::query()
            ->selectRaw('lop_hoc_phan_id, COUNT(*) as aggregate')
            ->whereIn('lop_hoc_phan_id', $timetableItems->pluck('lop_hoc_phan_id')->unique()->values())
            ->where('status', 'registered')
            ->groupBy('lop_hoc_phan_id')
            ->pluck('aggregate', 'lop_hoc_phan_id');

        $items = $timetableItems
            ->map(fn (ThoiKhoaBieu $item) => $this->timetablePayload($item, (int) ($registeredCounts[$item->lop_hoc_phan_id] ?? 0)))
            ->values();

        $weekCount = CauHinhTuanHoc::query()
            ->where('hoc_ky_id', $termId)
            ->value('so_tuan_mac_dinh') ?: 20;

        return response()->json([
            'data' => $items->all(),
            'period_numbers' => range(1, self::MAX_PERIODS_PER_DAY),
            'week_numbers' => range(1, max(1, (int) $weekCount)),
            'classes' => $classes->map(fn (LopHocPhan $class) => [
                'id' => $class->id,
                'hoc_ky_id' => $class->hoc_ky_id,
                'ma_hoc_phan' => $class->ma_hoc_phan,
                'ten_hoc_phan' => $class->ten_hoc_phan,
                'lop_hoc_phan' => $class->lop_hoc_phan,
                'nhom_hoc_phan' => $class->nhom_hoc_phan,
                'so_tin_chi' => (int) ($class->hocPhan?->so_tin_chi ?? 0),
                'si_so' => (int) ($class->si_so ?? 0),
            ])->values()->all(),
        ], 200, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    private function currentLecturer(Request $request): CanBo
    {
        $user = $request->user();
        abort_if($user?->role?->code !== 'lecturer', 403, 'Chỉ giảng viên được xem thời khóa biểu.');

        $lecturer = $user->profile instanceof CanBo
            ? $user->profile
            : CanBo::query()->where('user_id', $user?->username)->first();

        abort_if(! $lecturer, 403, 'Không tìm thấy hồ sơ giảng viên.');

        return $lecturer;
    }

    private function currentTermId(): int
    {
        $termId = (int) (HeThongCauHinh::query()->find('current_hoc_ky_id')?->value ?? 0);
        if ($termId <= 0) {
            $termId = (int) (HeThongCauHinh::query()->find('current_academic_term_id')?->value ?? 0);
        }

        return $termId;
    }

    private function timetablePayload(ThoiKhoaBieu $item, int $registeredCount): array
    {
        $dates = $this->computedDates($item);
        $class = $item->lopHocPhan;

        return [
            'id' => $item->id,
            'lop_hoc_phan_id' => $item->lop_hoc_phan_id,
            'hoc_ky_id' => $item->hoc_ky_id,
            'ma_hoc_phan' => $class?->ma_hoc_phan ?? $item->ma_hoc_phan_snapshot,
            'ten_hoc_phan' => $class?->ten_hoc_phan ?? $item->ten_hoc_phan_snapshot,
            'nhom_hoc_phan' => $class?->nhom_hoc_phan ?? $item->nhom_hoc_phan_snapshot,
            'lop_hoc_phan' => $class?->lop_hoc_phan ?? $item->lop_hoc_phan_snapshot,
            'so_tin_chi' => (int) ($class?->hocPhan?->so_tin_chi ?? 0),
            'si_so' => (int) ($class?->si_so ?? $item->si_so_snapshot ?? 0),
            'so_sv_da_dk' => $registeredCount,
            'thu' => (int) $item->thu,
            'tiet_bat_dau' => (int) $item->tiet_bat_dau,
            'tiet_ket_thuc' => (int) $item->tiet_ket_thuc,
            'periods' => range((int) $item->tiet_bat_dau, min(self::MAX_PERIODS_PER_DAY, (int) $item->tiet_ket_thuc)),
            'phong' => $item->phongHoc?->ma_phong ?? $item->ma_phong_snapshot,
            'ngay_bat_dau' => $dates['ngay_bat_dau'],
            'tuan_bat_dau' => (int) $item->tuan_bat_dau,
            'tuan_ket_thuc' => (int) $item->tuan_ket_thuc,
            'weeks' => range((int) $item->tuan_bat_dau, (int) $item->tuan_ket_thuc),
        ];
    }

    private function computedDates(ThoiKhoaBieu $item): array
    {
        $config = CauHinhTuanHoc::query()->where('hoc_ky_id', $item->hoc_ky_id)->first();
        if (! $config) {
            return ['ngay_bat_dau' => null];
        }

        return [
            'ngay_bat_dau' => Carbon::parse($config->tuan_1_bat_dau)
                ->addWeeks($item->tuan_bat_dau - 1)
                ->addDays($item->thu - 2)
                ->toDateString(),
        ];
    }
}
