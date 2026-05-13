<?php

namespace App\Http\Controllers\Api\Admin\AcademicTerm;

use App\Models\HocKy;
use App\Http\Controllers\Controller;
use App\Models\HeThongCauHinh;
use App\Models\NamHoc;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
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
        $academicYears = NamHoc::query()
            ->with(['hocKys' => fn ($query) => $query
                ->select(['id', 'nam_hoc_id', 'hoc_ky'])
                ->orderByRaw("CASE hoc_ky WHEN '1' THEN 1 WHEN '2' THEN 2 WHEN 'Hè' THEN 3 ELSE 99 END")
                ->orderBy('id')])
            ->orderByDesc('id')
            ->get()
            ->map(fn (NamHoc $namHoc) => $this->toAcademicYearPayload($namHoc))
            ->values();

        $terms = HocKy::query()
            ->with('namHoc:id,nam_hoc')
            ->join('nam_hocs', 'hoc_kys.nam_hoc_id', '=', 'nam_hocs.id')
            ->select('hoc_kys.*')
            ->orderByDesc('nam_hocs.id')
            ->orderByRaw("CASE hoc_kys.hoc_ky WHEN '1' THEN 1 WHEN '2' THEN 2 WHEN 'Hè' THEN 3 ELSE 99 END")
            ->orderBy('hoc_kys.id')
            ->get()
            ->map(fn (HocKy $hocKy) => $this->toAcademicTermPayload($hocKy))
            ->values();

        $currentAcademicTermId = $this->resolveCurrentHocKyId();
        $currentAcademicTerm = $currentAcademicTermId > 0
            ? HocKy::query()->with('namHoc:id,nam_hoc')->find($currentAcademicTermId)
            : null;

        $hocKyOptions = collect(self::HOC_KY_OPTIONS);

        return $this->jsonResponse([
            'nam_hocs' => $academicYears,
            'data' => $terms,
            'current_academic_term_id' => $currentAcademicTermId > 0 ? $currentAcademicTermId : null,
            'current_academic_term' => $currentAcademicTerm ? $this->toAcademicTermPayload($currentAcademicTerm) : null,
            'nam_hoc_options' => $academicYears->pluck('nam_hoc')->values(),
            'hoc_ky_options' => $hocKyOptions,
        ]);
    }

    public function current(): JsonResponse
    {
        $currentAcademicTermId = $this->resolveCurrentHocKyId();
        $currentAcademicTerm = $currentAcademicTermId > 0
            ? HocKy::query()->with('namHoc:id,nam_hoc')->find($currentAcademicTermId)
            : null;

        return $this->jsonResponse([
            'data' => $currentAcademicTerm ? $this->toAcademicTermPayload($currentAcademicTerm) : null,
            'is_configured' => $currentAcademicTerm !== null,
        ]);
    }

    public function storeAcademicYear(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'nam_hoc' => ['required', 'string', 'max:20', 'unique:nam_hocs,nam_hoc'],
            'set_current' => ['sometimes', 'boolean'],
            'hoc_ky' => ['required_if:set_current,true', Rule::in(self::HOC_KY_OPTIONS)],
        ]);

        $namHoc = DB::transaction(function () use ($payload): NamHoc {
            $namHoc = NamHoc::query()->create([
                'nam_hoc' => $payload['nam_hoc'],
            ]);

            $this->ensureAcademicYearTerms($namHoc);

            return $namHoc->load(['hocKys' => fn ($query) => $query
                ->select(['id', 'nam_hoc_id', 'hoc_ky'])
                ->orderByRaw("CASE hoc_ky WHEN '1' THEN 1 WHEN '2' THEN 2 WHEN 'Hè' THEN 3 ELSE 99 END")
                ->orderBy('id')]);
        });

        $currentAcademicTerm = null;

        if ((bool) ($payload['set_current'] ?? false)) {
            $currentAcademicTerm = $this->findTermOrFail($namHoc->id, (string) $payload['hoc_ky']);
            $this->saveCurrentAcademicTerm($request, $currentAcademicTerm);
        }

        $this->clearAcademicCatalogCache($namHoc->id);

        return $this->jsonResponse([
            'message' => 'Da tao nam hoc moi va 3 hoc ky mac dinh',
            'data' => $this->toAcademicYearPayload($namHoc),
            'current_academic_term' => $currentAcademicTerm ? $this->toAcademicTermPayload($currentAcademicTerm) : null,
        ], 201);
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
            'nam_hoc_id' => ['sometimes', 'integer', 'exists:nam_hocs,id'],
            'nam_hoc' => ['required_without:nam_hoc_id', 'string', 'max:20'],
            'hoc_ky' => ['required', Rule::in(self::HOC_KY_OPTIONS)],
        ]);

        $namHoc = isset($payload['nam_hoc_id'])
            ? NamHoc::query()->findOrFail((int) $payload['nam_hoc_id'])
            : NamHoc::query()->firstOrCreate(['nam_hoc' => $payload['nam_hoc']]);

        $this->ensureAcademicYearTerms($namHoc);
        $targetAcademicTerm = $this->findTermOrFail($namHoc->id, (string) $payload['hoc_ky']);

        $targetAcademicTerm->loadMissing('namHoc:id,nam_hoc');
        $previousAcademicTerm?->loadMissing('namHoc:id,nam_hoc');

        $this->saveCurrentAcademicTerm($request, $targetAcademicTerm);

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

    private function ensureAcademicYearTerms(NamHoc $namHoc): void
    {
        foreach (self::HOC_KY_OPTIONS as $hocKy) {
            HocKy::query()->firstOrCreate([
                'nam_hoc_id' => $namHoc->id,
                'hoc_ky' => $hocKy,
            ]);
        }
    }

    private function findTermOrFail(int $namHocId, string $hocKy): HocKy
    {
        return HocKy::query()
            ->with('namHoc:id,nam_hoc')
            ->where('nam_hoc_id', $namHocId)
            ->where('hoc_ky', $hocKy)
            ->firstOrFail();
    }

    private function saveCurrentAcademicTerm(Request $request, HocKy $academicTerm): void
    {
        $academicTerm->loadMissing('namHoc:id,nam_hoc');
        $updatedBy = (string) ($request->user()?->username ?? '');

        HeThongCauHinh::query()->updateOrCreate(
            ['key' => self::CURRENT_HOC_KY_ID_KEY],
            [
                'value' => (string) $academicTerm->id,
                'updated_by' => $updatedBy,
            ],
        );

        HeThongCauHinh::query()->updateOrCreate(
            ['key' => self::CURRENT_ACADEMIC_TERM_KEY],
            [
                'value' => (string) $academicTerm->id,
                'updated_by' => $updatedBy,
            ],
        );

        HeThongCauHinh::query()->updateOrCreate(
            ['key' => self::CURRENT_ACADEMIC_TERM_ARRAY_KEY],
            [
                'value' => json_encode([
                    'id' => $academicTerm->id,
                    'nam_hoc_id' => $academicTerm->nam_hoc_id,
                    'nam_hoc' => (string) ($academicTerm->namHoc?->nam_hoc ?? ''),
                    'hoc_ky' => (string) $academicTerm->hoc_ky,
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'updated_by' => $updatedBy,
            ],
        );

        $this->clearAcademicCatalogCache($academicTerm->nam_hoc_id);
    }

    private function clearAcademicCatalogCache(?int $namHocId = null): void
    {
        Cache::forget('academic_catalog:nam_hocs');
        Cache::forget('academic_catalog:hoc_kys:all');
        Cache::forget('academic_catalog:current_term');

        if ($namHocId) {
            Cache::forget('academic_catalog:hoc_kys:' . $namHocId);
        }
    }

    private function toAcademicYearPayload(NamHoc $namHoc): array
    {
        $namHoc->loadMissing(['hocKys' => fn ($query) => $query
            ->select(['id', 'nam_hoc_id', 'hoc_ky'])
            ->orderByRaw("CASE hoc_ky WHEN '1' THEN 1 WHEN '2' THEN 2 WHEN 'Hè' THEN 3 ELSE 99 END")
            ->orderBy('id')]);

        return [
            'id' => $namHoc->id,
            'nam_hoc' => (string) $namHoc->nam_hoc,
            'hoc_kys' => $namHoc->hocKys
                ->map(fn (HocKy $hocKy) => $this->toAcademicTermPayload($hocKy))
                ->values(),
        ];
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
