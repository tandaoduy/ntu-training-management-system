<?php

namespace App\Http\Controllers\Api\Admin\AcademicTerm;

use App\Models\HocKy;
use App\Http\Controllers\Controller;
use App\Models\HeThongCauHinh;
use App\Models\NamHoc;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AcademicTermController extends Controller
{
    private const CURRENT_HOC_KY_ID_KEY = 'current_hoc_ky_id';
    private const CURRENT_ACADEMIC_TERM_KEY = 'current_academic_term_id';
    private const CURRENT_ACADEMIC_TERM_ARRAY_KEY = 'current_academic_term';
    private const HOC_KY_OPTIONS = ['1', '2', 'Hè'];

    private function jsonResponse(array $payload, int $status = 200): JsonResponse
    {
        return response()->json($payload, $status, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    public function index(): JsonResponse
    {
        $terms = HocKy::query()
            ->with('namHoc:id,nam_hoc')
            ->orderByDesc('id')
            ->get()
            ->map(fn (HocKy $hocKy) => $this->toAcademicTermPayload($hocKy))
            ->values();

        $currentAcademicTermId = $this->resolveCurrentHocKyId();
        $currentAcademicTermArray = json_decode(
            (string) (HeThongCauHinh::query()->find(self::CURRENT_ACADEMIC_TERM_ARRAY_KEY)?->value ?? ''),
            true,
        );

        $namHocOptions = NamHoc::query()
            ->orderByDesc('id')
            ->pluck('nam_hoc')
            ->values();

        $hocKyOptions = collect(self::HOC_KY_OPTIONS);

        return $this->jsonResponse([
            'data' => $terms,
            'current_academic_term_id' => $currentAcademicTermId > 0 ? $currentAcademicTermId : null,
            'current_academic_term' => is_array($currentAcademicTermArray) ? $currentAcademicTermArray : null,
            'nam_hoc_options' => $namHocOptions,
            'hoc_ky_options' => $hocKyOptions,
        ]);
    }

    public function current(): JsonResponse
    {
        $currentAcademicTermArray = json_decode(
            (string) (HeThongCauHinh::query()->find(self::CURRENT_ACADEMIC_TERM_ARRAY_KEY)?->value ?? ''),
            true,
        );

        $currentAcademicTerm = null;

        if (is_array($currentAcademicTermArray)) {
            $namHoc = $currentAcademicTermArray['nam_hoc'] ?? null;
            $hocKy = $currentAcademicTermArray['hoc_ky'] ?? null;

            if (is_string($namHoc) && ($hocKy !== null)) {
                $currentAcademicTerm = HocKy::query()
                    ->where('hoc_ky', (string) $hocKy)
                    ->whereHas('namHoc', fn ($query) => $query->where('nam_hoc', $namHoc))
                    ->first();
            }
        }

        $currentAcademicTermId = $this->resolveCurrentHocKyId();

        if (! $currentAcademicTerm) {
            $currentAcademicTerm = $currentAcademicTermId > 0 ? HocKy::query()->find($currentAcademicTermId) : null;
        }

        if (! $currentAcademicTerm) {
            $currentAcademicTerm = HocKy::query()->orderByDesc('id')->first();
        }

        return $this->jsonResponse([
            'data' => $currentAcademicTerm ? $this->toAcademicTermPayload($currentAcademicTerm) : null,
            'current_academic_term' => is_array($currentAcademicTermArray) ? $currentAcademicTermArray : null,
        ]);
    }

    public function switchCurrent(Request $request): JsonResponse
    {
        return $this->setCurrentAcademicTerm($request);
    }

    public function update(Request $request, HocKy $academicTerm): JsonResponse
    {
        return $this->setCurrentAcademicTerm($request, $academicTerm);
    }

    private function setCurrentAcademicTerm(Request $request, ?HocKy $previousAcademicTerm = null): JsonResponse
    {
        $payload = $request->validate([
            'nam_hoc' => ['required', 'string', 'max:20'],
            'hoc_ky' => ['required', Rule::in(self::HOC_KY_OPTIONS)],
        ]);

        $namHoc = NamHoc::query()->firstOrCreate([
            'nam_hoc' => $payload['nam_hoc'],
        ]);

        $targetAcademicTerm = HocKy::query()->firstOrCreate([
            'nam_hoc_id' => $namHoc->id,
            'hoc_ky' => (string) $payload['hoc_ky'],
        ]);

        $targetAcademicTerm->loadMissing('namHoc:id,nam_hoc');
        $previousAcademicTerm?->loadMissing('namHoc:id,nam_hoc');

        HeThongCauHinh::query()->updateOrCreate(
            ['key' => self::CURRENT_HOC_KY_ID_KEY],
            [
                'value' => (string) $targetAcademicTerm->id,
                'updated_by' => (string) ($request->user()?->username ?? ''),
            ],
        );

        HeThongCauHinh::query()->updateOrCreate(
            ['key' => self::CURRENT_ACADEMIC_TERM_KEY],
            [
                'value' => (string) $targetAcademicTerm->id,
                'updated_by' => (string) ($request->user()?->username ?? ''),
            ],
        );

        HeThongCauHinh::query()->updateOrCreate(
            ['key' => self::CURRENT_ACADEMIC_TERM_ARRAY_KEY],
            [
                'value' => json_encode([
                    'nam_hoc' => (string) ($targetAcademicTerm->namHoc?->nam_hoc ?? ''),
                    'hoc_ky' => (string) $targetAcademicTerm->hoc_ky,
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'updated_by' => (string) ($request->user()?->username ?? ''),
            ],
        );

        return $this->jsonResponse([
            'message' => 'Da chuyen nam hoc hoc ky hien tai thanh cong, du lieu hoc ky cu duoc giu nguyen',
            'data' => [
                'previous_academic_term' => $previousAcademicTerm ? $this->toAcademicTermPayload($previousAcademicTerm) : null,
                'current_academic_term' => $this->toAcademicTermPayload($targetAcademicTerm),
            ],
        ]);
    }

    private function resolveCurrentHocKyId(): int
    {
        $newId = (int) (HeThongCauHinh::query()->find(self::CURRENT_HOC_KY_ID_KEY)?->value ?? 0);

        if ($newId > 0) {
            return $newId;
        }

        return (int) (HeThongCauHinh::query()->find(self::CURRENT_ACADEMIC_TERM_KEY)?->value ?? 0);
    }

    private function toAcademicTermPayload(HocKy $hocKy): array
    {
        $hocKy->loadMissing('namHoc:id,nam_hoc');

        return [
            'id' => $hocKy->id,
            'nam_hoc_id' => $hocKy->nam_hoc_id,
            'nam_hoc' => (string) ($hocKy->namHoc?->nam_hoc ?? ''),
            'hoc_ky' => (string) $hocKy->hoc_ky,
        ];
    }
}
