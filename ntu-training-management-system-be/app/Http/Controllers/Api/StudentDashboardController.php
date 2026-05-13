<?php

namespace App\Http\Controllers\Api;

use App\Models\HocKy;
use App\Models\HeThongCauHinh;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentDashboardController extends Controller
{
    private function jsonResponse(array $payload, int $status = 200): JsonResponse
    {
        return response()->json($payload, $status, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user()?->loadMissing(['role', 'student']);

        $currentAcademicTermArray = json_decode((string) (HeThongCauHinh::query()->find('current_academic_term')?->value ?? ''), true);
        $hocKyHienHanh = null;

        if (is_array($currentAcademicTermArray)) {
            $namHoc = $currentAcademicTermArray['nam_hoc'] ?? null;
            $hocKy = $currentAcademicTermArray['hoc_ky'] ?? null;

            if (is_string($namHoc) && ($hocKy !== null)) {
                $hocKyHienHanh = HocKy::query()
                    ->where('hoc_ky', (string) $hocKy)
                    ->whereHas('namHoc', fn ($query) => $query->where('nam_hoc', $namHoc))
                    ->first();
            }
        }

        $currentAcademicTermId = (int) (HeThongCauHinh::query()->find('current_hoc_ky_id')?->value ?? 0);

        if ($currentAcademicTermId <= 0) {
            $currentAcademicTermId = (int) (HeThongCauHinh::query()->find('current_academic_term_id')?->value ?? 0);
        }

        if (! $hocKyHienHanh) {
            $hocKyHienHanh = $currentAcademicTermId > 0
                ? HocKy::query()->find($currentAcademicTermId)
                : null;
        }

        $hocKyHienHanh?->loadMissing('namHoc:id,nam_hoc');

        $hocKyPayload = $hocKyHienHanh ? [
            'id' => $hocKyHienHanh->id,
            'nam_hoc_id' => $hocKyHienHanh->nam_hoc_id,
            'nam_hoc' => (string) ($hocKyHienHanh->namHoc?->nam_hoc ?? ''),
            'hoc_ky' => (string) $hocKyHienHanh->hoc_ky,
        ] : null;

        return $this->jsonResponse([
            'message' => 'Student dashboard data',
            'status' => $user?->student ? 'ok' : 'missing_student_profile',
            'student' => $user?->student,
            'permissions' => $user?->permissionCodes()->values() ?? [],
            'hoc_ky_hien_hanh' => $hocKyPayload,
            'hoc_ky_hien_hanh_configured' => $hocKyPayload !== null,
        ]);
    }
}
