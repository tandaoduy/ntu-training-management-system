<?php

namespace App\Http\Controllers\Api\Admin\GradeEntry;

use App\Http\Controllers\Controller;
use App\Models\GradeInputPeriod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GradeInputPeriodController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->assertAdmin($request);

        $periods = GradeInputPeriod::query()
            ->with('hocKy.namHoc:id,nam_hoc')
            ->latest('id')
            ->get()
            ->map(fn (GradeInputPeriod $period) => $this->periodPayload($period))
            ->values();

        return $this->jsonResponse(['data' => $periods->all()]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->assertAdmin($request);

        $payload = $request->validate([
            'hoc_ky_id' => ['required', 'integer', 'exists:hoc_kys,id'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'status' => ['nullable', 'string', 'in:open,closed'],
        ]);

        $period = GradeInputPeriod::query()->create([
            'hoc_ky_id' => (int) $payload['hoc_ky_id'],
            'starts_at' => $payload['starts_at'],
            'ends_at' => $payload['ends_at'],
            'status' => $payload['status'] ?? 'open',
            'created_by' => $request->user()?->id,
        ]);

        return $this->jsonResponse([
            'message' => 'Đã cấu hình thời gian nhập điểm.',
            'data' => $this->periodPayload($period->load('hocKy.namHoc:id,nam_hoc')),
        ], 201);
    }

    public function update(Request $request, GradeInputPeriod $gradeInputPeriod): JsonResponse
    {
        $this->assertAdmin($request);

        $payload = $request->validate([
            'hoc_ky_id' => ['required', 'integer', 'exists:hoc_kys,id'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'status' => ['required', 'string', 'in:open,closed'],
        ]);

        $gradeInputPeriod->fill([
            'hoc_ky_id' => (int) $payload['hoc_ky_id'],
            'starts_at' => $payload['starts_at'],
            'ends_at' => $payload['ends_at'],
            'status' => $payload['status'],
        ])->save();

        return $this->jsonResponse([
            'message' => 'Đã cập nhật thời gian nhập điểm.',
            'data' => $this->periodPayload($gradeInputPeriod->fresh('hocKy.namHoc:id,nam_hoc')),
        ]);
    }

    public function destroy(Request $request, GradeInputPeriod $gradeInputPeriod): JsonResponse
    {
        $this->assertAdmin($request);

        $gradeInputPeriod->delete();

        return $this->jsonResponse(['message' => 'Đã xóa thời gian nhập điểm.']);
    }

    private function assertAdmin(Request $request): void
    {
        $request->user()?->loadMissing('role');

        if ($request->user()?->role?->code !== 'admin') {
            abort(403, 'Chỉ quản trị viên được cấu hình thời gian nhập điểm.');
        }
    }

    private function periodPayload(?GradeInputPeriod $period): ?array
    {
        if (! $period) {
            return null;
        }

        $period->loadMissing('hocKy.namHoc:id,nam_hoc');

        return [
            'id' => $period->id,
            'hoc_ky_id' => $period->hoc_ky_id,
            'starts_at' => $period->starts_at?->toISOString(),
            'ends_at' => $period->ends_at?->toISOString(),
            'status' => $period->status,
            'term' => $period->hocKy ? [
                'hoc_ky' => $period->hocKy->hoc_ky,
                'nam_hoc' => $period->hocKy->namHoc?->nam_hoc,
            ] : null,
        ];
    }

    private function jsonResponse(array $payload, int $status = 200): JsonResponse
    {
        return response()->json($payload, $status, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}
