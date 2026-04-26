<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HocKy;
use App\Models\NamHoc;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AcademicCatalogController extends Controller
{
    private function jsonResponse(array $payload, int $status = 200): JsonResponse
    {
        return response()->json($payload, $status, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    public function namHocs(): JsonResponse
    {
        $items = NamHoc::query()
            ->select(['id', 'nam_hoc'])
            ->orderByDesc('id')
            ->get();

        return $this->jsonResponse([
            'data' => $items,
        ]);
    }

    public function hocKys(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'nam_hoc_id' => ['required', 'integer', 'exists:nam_hocs,id'],
        ]);

        $items = HocKy::query()
            ->select(['id', 'nam_hoc_id', 'hoc_ky'])
            ->where('nam_hoc_id', (int) $payload['nam_hoc_id'])
            ->orderByRaw("CASE hoc_ky WHEN '1' THEN 1 WHEN '2' THEN 2 WHEN 'Hè' THEN 3 ELSE 99 END")
            ->orderBy('id')
            ->get();

        return $this->jsonResponse([
            'data' => $items,
        ]);
    }
}
