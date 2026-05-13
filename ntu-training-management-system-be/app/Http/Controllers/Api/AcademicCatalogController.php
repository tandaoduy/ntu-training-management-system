<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HeThongCauHinh;
use App\Models\HocKy;
use App\Models\NamHoc;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AcademicCatalogController extends Controller
{
    private function jsonResponse(array $payload, int $status = 200): JsonResponse
    {
        return response()->json($payload, $status, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    public function namHocs(): JsonResponse
    {
        $items = Cache::remember('academic_catalog:nam_hocs', now()->addMinutes(30), fn () => NamHoc::query()
            ->select(['id', 'nam_hoc'])
            ->orderByDesc('id')
            ->get());

        return $this->jsonResponse([
            'data' => $items,
        ]);
    }

    public function hocKys(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'nam_hoc_id' => ['sometimes', 'integer', 'exists:nam_hocs,id'],
        ]);

        $cacheKey = 'academic_catalog:hoc_kys:' . ($payload['nam_hoc_id'] ?? 'all');
        $items = Cache::remember($cacheKey, now()->addMinutes(30), fn () => HocKy::query()
            ->select(['id', 'nam_hoc_id', 'hoc_ky'])
            ->when(isset($payload['nam_hoc_id']), fn ($query) => $query
                ->where('nam_hoc_id', (int) $payload['nam_hoc_id']))
            ->orderByDesc('nam_hoc_id')
            ->orderByRaw("CASE hoc_ky WHEN '1' THEN 1 WHEN '2' THEN 2 WHEN 'Hè' THEN 3 ELSE 99 END")
            ->orderBy('id')
            ->get());

        return $this->jsonResponse([
            'data' => $items,
        ]);
    }

    public function currentTerm(): JsonResponse
    {
        $payload = Cache::remember('academic_catalog:current_term', now()->addMinutes(5), function (): array {
            $currentTermId = (int) (HeThongCauHinh::query()->find('current_hoc_ky_id')?->value ?? 0);

            if ($currentTermId <= 0) {
                $currentTermId = (int) (HeThongCauHinh::query()->find('current_academic_term_id')?->value ?? 0);
            }

            $currentTerm = $currentTermId > 0
                ? HocKy::query()->with('namHoc:id,nam_hoc')->find($currentTermId)
                : null;

            return [
                'data' => $currentTerm ? [
                    'id' => $currentTerm->id,
                    'nam_hoc_id' => $currentTerm->nam_hoc_id,
                    'nam_hoc' => (string) ($currentTerm->namHoc?->nam_hoc ?? ''),
                    'hoc_ky' => (string) $currentTerm->hoc_ky,
                ] : null,
                'is_configured' => $currentTerm !== null,
            ];
        });

        return $this->jsonResponse($payload);
    }
}
