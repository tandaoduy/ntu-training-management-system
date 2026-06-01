<?php

namespace App\Http\Controllers\Api\StudyPlanRegistration;

use App\Http\Controllers\Controller;
use App\Models\HeThongCauHinh;
use App\Models\HocKy;
use App\Models\HocPhan;
use App\Models\KeHoachHocTap;
use App\Models\KeHoachHocTapDotDangKy;
use App\Models\SinhVien;
use App\Models\SinhVienChuongTrinh;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class StudyPlanRegistrationController extends Controller
{
    private const MAX_CREDITS = 45;
    private const SEMESTER_OPTIONS = ['1', '2', 'Hè'];

    private function jsonResponse(array $payload, int $status = 200): JsonResponse
    {
        return response()->json($payload, $status, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    public function index(): JsonResponse
    {
        $periods = KeHoachHocTapDotDangKy::query()
            ->with(['currentHocKy.namHoc:id,nam_hoc', 'targetHocKy.namHoc:id,nam_hoc'])
            ->latest('id')
            ->get()
            ->map(fn (KeHoachHocTapDotDangKy $period) => $this->periodPayload($period))
            ->values();

        return $this->jsonResponse(['data' => $periods]);
    }

    public function store(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'target_hoc_ky_id' => ['required', 'integer', 'exists:hoc_kys,id'],
            'starts_at' => ['required', 'date', 'regex:/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/'],
            'ends_at' => ['required', 'date', 'after:starts_at', 'regex:/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/'],
            'status' => ['sometimes', Rule::in(['draft', 'open', 'closed'])],
            'ghi_chu' => ['nullable', 'string', 'max:500'],
        ]);

        $currentTerm = $this->currentTerm();
        if (! $currentTerm) {
            return $this->jsonResponse(['message' => 'Chưa cấu hình học kỳ hiện tại.'], 422);
        }

        $targetTerm = HocKy::query()->with('namHoc:id,nam_hoc')->findOrFail((int) $payload['target_hoc_ky_id']);

        $period = KeHoachHocTapDotDangKy::query()->create([
            'current_hoc_ky_id' => $currentTerm->id,
            'target_hoc_ky_id' => $targetTerm->id,
            'starts_at' => $payload['starts_at'],
            'ends_at' => $payload['ends_at'],
            'status' => $payload['status'] ?? 'open',
            'ghi_chu' => $payload['ghi_chu'] ?? null,
            'created_by' => (string) ($request->user()?->username ?? ''),
        ]);

        $period->load(['currentHocKy.namHoc:id,nam_hoc', 'targetHocKy.namHoc:id,nam_hoc']);

        return $this->jsonResponse([
            'message' => 'Đã thiết lập thời gian đăng ký kế hoạch học tập.',
            'data' => $this->periodPayload($period),
        ], 201);
    }

    public function studentStatus(Request $request): JsonResponse
    {
        $student = $this->resolveCurrentStudent($request);
        if (! $student) {
            return $this->jsonResponse([
                'message' => 'Không xác định được hồ sơ sinh viên cho tài khoản hiện tại.',
                'status' => 'missing_student_profile',
                'data' => [
                    'max_credits' => self::MAX_CREDITS,
                    'can_register' => false,
                    'registration_period' => null,
                    'plan' => null,
                ],
            ]);
        }
        $period = $this->activePeriod();
        $hasDetailTermColumn = Schema::hasColumn('ke_hoach_hoc_tap_chi_tiets', 'hoc_ky_id');
        $planRelations = $hasDetailTermColumn
            ? ['chiTiets.hocPhan:id,ma_hoc_phan,ten_hoc_phan,so_tin_chi', 'chiTiets.hocKy.namHoc:id,nam_hoc', 'hocKy.namHoc:id,nam_hoc']
            : ['chiTiets.hocPhan:id,ma_hoc_phan,ten_hoc_phan,so_tin_chi', 'hocKy.namHoc:id,nam_hoc'];

        $existingPlanQuery = KeHoachHocTap::query()
            ->with($planRelations)
            ->where('sinh_vien_id', $student->id)
            ->whereIn('status', ['submitted', 'locked']);

        $existingPlan = $period
            ? (clone $existingPlanQuery)->where('dot_dang_ky_id', $period->id)->first()
            : null;

        if (! $existingPlan) {
            $existingPlan = $existingPlanQuery
                ->latest('submitted_at')
                ->latest('id')
                ->first();
        }

        return $this->jsonResponse([
            'status' => $period ? 'open' : 'closed',
            'data' => [
                'max_credits' => self::MAX_CREDITS,
                'can_register' => $period !== null,
                'registration_period' => $period ? $this->periodPayload($period) : null,
                'plan' => $existingPlan ? $this->planPayload($existingPlan) : null,
            ],
        ]);
    }

    public function submitStudentPlan(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'course_ids' => ['required', 'array', 'min:1'],
            'course_ids.*' => ['integer', 'distinct', 'exists:hoc_phans,id'],
            'hoc_ky_id' => ['nullable', 'integer', 'exists:hoc_kys,id'],
            'course_terms' => ['nullable', 'array'],
            'course_terms.*.course_id' => ['required_with:course_terms', 'integer', 'distinct', 'exists:hoc_phans,id'],
            'course_terms.*.hoc_ky_id' => ['required_with:course_terms', 'integer', 'exists:hoc_kys,id'],
        ]);

        $student = $this->resolveCurrentStudent($request);
        if (! $student) {
            return $this->jsonResponse(['message' => 'Không xác định được sinh viên.'], 404);
        }

        $period = $this->activePeriod();
        if (! $period) {
            return $this->jsonResponse(['message' => 'Hiện không trong thời gian đăng ký kế hoạch học tập.'], 422);
        }

        $targetTerm = isset($payload['hoc_ky_id'])
            ? HocKy::query()->with('namHoc:id,nam_hoc')->findOrFail((int) $payload['hoc_ky_id'])
            : $period->targetHocKy()->with('namHoc:id,nam_hoc')->first();

        if (! $targetTerm) {
            return $this->jsonResponse(['message' => 'Không xác định được học kỳ đăng ký KHHT.'], 422);
        }

        $courseIds = collect($payload['course_ids'])->map(fn ($id) => (int) $id)->values();
        $hasDetailTermColumn = Schema::hasColumn('ke_hoach_hoc_tap_chi_tiets', 'hoc_ky_id');
        $courseTermIds = collect($payload['course_terms'] ?? [])
            ->mapWithKeys(fn ($item) => [(int) $item['course_id'] => (int) $item['hoc_ky_id']]);
        $allowedCourseIds = $this->allowedCourseIds($student);
        $invalidCourseIds = $courseIds->diff($allowedCourseIds);

        if ($invalidCourseIds->isNotEmpty()) {
            return $this->jsonResponse(['message' => 'Có học phần không thuộc chương trình đào tạo hoặc nhóm học phần bổ sung.'], 422);
        }

        $invalidTermCourseIds = $courseTermIds->keys()->diff($courseIds);
        if ($invalidTermCourseIds->isNotEmpty()) {
            return $this->jsonResponse(['message' => 'Có học phần trong học kỳ đăng ký không thuộc danh sách KHHT.'], 422);
        }

        $terms = HocKy::query()
            ->with('namHoc:id,nam_hoc')
            ->whereIn('id', $courseTermIds->values()->unique()->values())
            ->get()
            ->keyBy('id');

        foreach ($courseTermIds as $termId) {
            $term = $terms->get($termId);
            if (! $term) {
                return $this->jsonResponse(['message' => 'Có học phần đang chọn học kỳ không hợp lệ.'], 422);
            }
        }

        $courses = HocPhan::query()
            ->whereIn('id', $courseIds)
            ->where('trang_thai', true)
            ->get(['id', 'ma_hoc_phan', 'ten_hoc_phan', 'so_tin_chi']);

        $totalCredits = (int) $courses->sum('so_tin_chi');
        if ($totalCredits > self::MAX_CREDITS) {
            return $this->jsonResponse(['message' => 'Tổng số tín chỉ đăng ký KHHT không được vượt quá 45 tín chỉ trong một học kỳ.'], 422);
        }

        $plan = DB::transaction(function () use ($student, $period, $targetTerm, $hasDetailTermColumn, $courseTermIds, $courses, $totalCredits): KeHoachHocTap {
            $plan = KeHoachHocTap::query()->updateOrCreate(
                [
                    'sinh_vien_id' => $student->id,
                    'dot_dang_ky_id' => $period->id,
                ],
                [
                    'hoc_ky_id' => $targetTerm->id,
                    'tong_tin_chi' => $totalCredits,
                    'status' => 'submitted',
                    'submitted_at' => now(),
                ],
            );

            $plan->chiTiets()->delete();
            foreach ($courses as $course) {
                $detailPayload = [
                    'hoc_phan_id' => $course->id,
                    'so_tin_chi' => $course->so_tin_chi,
                ];

                if ($hasDetailTermColumn) {
                    $detailPayload['hoc_ky_id'] = $courseTermIds->get($course->id, $targetTerm->id);
                }

                $plan->chiTiets()->create($detailPayload);
            }

            return $plan->load($hasDetailTermColumn
                ? ['chiTiets.hocPhan:id,ma_hoc_phan,ten_hoc_phan,so_tin_chi', 'chiTiets.hocKy.namHoc:id,nam_hoc']
                : ['chiTiets.hocPhan:id,ma_hoc_phan,ten_hoc_phan,so_tin_chi']);
        });

        return $this->jsonResponse([
            'message' => 'Đã xác nhận kế hoạch học tập.',
            'data' => $this->planPayload($plan),
        ]);
    }

    public function statistics(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'hoc_ky_id' => ['nullable', 'integer', 'exists:hoc_kys,id'],
            'nam_hoc' => ['nullable', 'string', 'exists:nam_hocs,nam_hoc'],
            'hoc_ky' => ['nullable', 'string'],
        ]);

        $termIds = $this->statisticsTermIds($payload);
        $termId = count($termIds) === 1 ? (int) $termIds[0] : 0;

        $term = $termId > 0 ? HocKy::query()->with('namHoc:id,nam_hoc')->find($termId) : null;

        $allCourses = HocPhan::query()
            ->orderBy('ma_hoc_phan')
            ->get(['id', 'ma_hoc_phan', 'ten_hoc_phan', 'so_tin_chi']);

        $rows = DB::table('ke_hoach_hoc_tap_chi_tiets as ct')
            ->join('ke_hoach_hoc_taps as khht', 'khht.id', '=', 'ct.ke_hoach_hoc_tap_id')
            ->join('hoc_phans as hp', 'hp.id', '=', 'ct.hoc_phan_id')
            ->when(! empty($termIds), fn ($query) => Schema::hasColumn('ke_hoach_hoc_tap_chi_tiets', 'hoc_ky_id')
                ? $query->whereIn(DB::raw('COALESCE(ct.hoc_ky_id, khht.hoc_ky_id)'), $termIds)
                : $query->whereIn('khht.hoc_ky_id', $termIds))
            ->whereIn('khht.status', ['submitted', 'locked'])
            ->groupBy('hp.id', 'hp.ma_hoc_phan', 'hp.ten_hoc_phan', 'hp.so_tin_chi')
            ->select([
                'hp.id',
                'hp.ma_hoc_phan',
                'hp.ten_hoc_phan',
                'hp.so_tin_chi',
                DB::raw('COUNT(DISTINCT khht.sinh_vien_id) as so_luong_sinh_vien'),
            ])
            ->orderByDesc('so_luong_sinh_vien')
            ->orderBy('hp.ma_hoc_phan')
            ->get();

        return $this->jsonResponse([
            'data' => [
                'term' => $term ? $this->termPayload($term) : null,
                'total_students' => (int) $rows->sum('so_luong_sinh_vien'),
                'all_courses' => $allCourses,
                'courses' => $rows,
            ],
        ]);
    }

    public function courseRegistrations(Request $request, HocPhan $hocPhan): JsonResponse
    {
        $payload = $request->validate([
            'hoc_ky_id' => ['nullable', 'integer', 'exists:hoc_kys,id'],
            'nam_hoc' => ['nullable', 'string', 'exists:nam_hocs,nam_hoc'],
            'hoc_ky' => ['nullable', 'string'],
        ]);

        $termIds = $this->statisticsTermIds($payload);
        $termId = count($termIds) === 1 ? (int) $termIds[0] : 0;

        $term = $termId > 0 ? HocKy::query()->with('namHoc:id,nam_hoc')->find($termId) : null;

        $students = DB::table('ke_hoach_hoc_tap_chi_tiets as ct')
            ->join('ke_hoach_hoc_taps as khht', 'khht.id', '=', 'ct.ke_hoach_hoc_tap_id')
            ->join('sinh_viens as sv', 'sv.id', '=', 'khht.sinh_vien_id')
            ->leftJoin('lops as lop', 'lop.id', '=', 'sv.lop_id')
            ->where('ct.hoc_phan_id', $hocPhan->id)
            ->when(! empty($termIds), fn ($query) => Schema::hasColumn('ke_hoach_hoc_tap_chi_tiets', 'hoc_ky_id')
                ? $query->whereIn(DB::raw('COALESCE(ct.hoc_ky_id, khht.hoc_ky_id)'), $termIds)
                : $query->whereIn('khht.hoc_ky_id', $termIds))
            ->whereIn('khht.status', ['submitted', 'locked'])
            ->select([
                'sv.id',
                'sv.user_id as ma_sinh_vien',
                'sv.ten_sinh_vien',
                'sv.ngay_sinh',
                DB::raw('COALESCE(lop.lop_hoc_phan, sv.ma_lop) as ma_lop'),
                'khht.status',
                'khht.submitted_at',
            ])
            ->orderBy('sv.user_id')
            ->get();

        return $this->jsonResponse([
            'data' => [
                'term' => $term ? $this->termPayload($term) : null,
                'course' => [
                    'id' => $hocPhan->id,
                    'ma_hoc_phan' => $hocPhan->ma_hoc_phan,
                    'ten_hoc_phan' => $hocPhan->ten_hoc_phan,
                    'so_tin_chi' => $hocPhan->so_tin_chi,
                ],
                'students' => $students,
            ],
        ]);
    }

    private function statisticsTermIds(array $payload): array
    {
        if (isset($payload['hoc_ky_id'])) {
            return [(int) $payload['hoc_ky_id']];
        }

        $year = trim((string) ($payload['nam_hoc'] ?? ''));
        $semester = trim((string) ($payload['hoc_ky'] ?? ''));

        if ($year === '' && $semester === '') {
            $currentTerm = $this->currentTerm();

            return $currentTerm ? [(int) $currentTerm->id] : [];
        }

        return HocKy::query()
            ->when($year !== '', fn ($query) => $query->whereHas('namHoc', fn ($yearQuery) => $yearQuery->where('nam_hoc', $year)))
            ->when($semester !== '', fn ($query) => $query->where('hoc_ky', $semester))
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    private function currentTerm(): ?HocKy
    {
        $termId = (int) (HeThongCauHinh::query()->find('current_hoc_ky_id')?->value ?? 0);
        if ($termId <= 0) {
            $termId = (int) (HeThongCauHinh::query()->find('current_academic_term_id')?->value ?? 0);
        }

        return $termId > 0 ? HocKy::query()->with('namHoc:id,nam_hoc')->find($termId) : null;
    }

    private function activePeriod(): ?KeHoachHocTapDotDangKy
    {
        return KeHoachHocTapDotDangKy::query()
            ->with(['currentHocKy.namHoc:id,nam_hoc', 'targetHocKy.namHoc:id,nam_hoc'])
            ->where('status', 'open')
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>=', now())
            ->latest('id')
            ->first();
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
            return SinhVien::query()->where('user_id', $user->username)->first();
        }

        return null;
    }

    private function allowedCourseIds(SinhVien $student): \Illuminate\Support\Collection
    {
        $assignment = SinhVienChuongTrinh::query()
            ->where('sinh_vien_id', $student->id)
            ->where('locked', true)
            ->latest('id')
            ->first();

        if (! $assignment) {
            return collect();
        }

        return DB::table('phien_ban_ctdt_hoc_phans')
            ->where('phien_ban_ctdt_id', $assignment->phien_ban_ctdt_id)
            ->pluck('hoc_phan_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();
    }

    private function periodPayload(KeHoachHocTapDotDangKy $period): array
    {
        $period->loadMissing(['currentHocKy.namHoc:id,nam_hoc', 'targetHocKy.namHoc:id,nam_hoc']);

        return [
            'id' => $period->id,
            'current_term' => $period->currentHocKy ? $this->termPayload($period->currentHocKy) : null,
            'target_term' => $period->targetHocKy ? $this->termPayload($period->targetHocKy) : null,
            'target_hoc_ky_id' => $period->target_hoc_ky_id,
            'starts_at' => $period->starts_at?->toDateTimeString(),
            'ends_at' => $period->ends_at?->toDateTimeString(),
            'status' => $period->status,
            'ghi_chu' => $period->ghi_chu,
            'is_active' => $period->status === 'open' && $period->starts_at <= now() && $period->ends_at >= now(),
        ];
    }

    private function planPayload(KeHoachHocTap $plan): array
    {
        $hasDetailTermColumn = Schema::hasColumn('ke_hoach_hoc_tap_chi_tiets', 'hoc_ky_id');
        $plan->loadMissing($hasDetailTermColumn
            ? ['chiTiets.hocPhan:id,ma_hoc_phan,ten_hoc_phan,so_tin_chi', 'chiTiets.hocKy.namHoc:id,nam_hoc']
            : ['chiTiets.hocPhan:id,ma_hoc_phan,ten_hoc_phan,so_tin_chi']);

        $plan->loadMissing('hocKy.namHoc:id,nam_hoc');

        return [
            'id' => $plan->id,
            'hoc_ky_id' => $plan->hoc_ky_id,
            'term' => $plan->hocKy ? $this->termPayload($plan->hocKy) : null,
            'tong_tin_chi' => $plan->tong_tin_chi,
            'status' => $plan->status,
            'submitted_at' => $plan->submitted_at?->toDateTimeString(),
            'course_ids' => $plan->chiTiets->pluck('hoc_phan_id')->values(),
            'course_terms' => $hasDetailTermColumn ? $plan->chiTiets->map(fn ($detail) => [
                'course_id' => $detail->hoc_phan_id,
                'hoc_ky_id' => $detail->hoc_ky_id ?? $plan->hoc_ky_id,
                'term' => $detail->hocKy ? $this->termPayload($detail->hocKy) : ($plan->hocKy ? $this->termPayload($plan->hocKy) : null),
            ])->values() : collect(),
            'courses' => $plan->chiTiets->map(fn ($detail) => [
                'id' => $detail->hocPhan?->id,
                'ma_hoc_phan' => $detail->hocPhan?->ma_hoc_phan,
                'ten_hoc_phan' => $detail->hocPhan?->ten_hoc_phan,
                'so_tin_chi' => $detail->so_tin_chi,
            ])->values(),
        ];
    }

    private function termPayload(HocKy $term): array
    {
        $term->loadMissing('namHoc:id,nam_hoc');

        return [
            'id' => $term->id,
            'nam_hoc_id' => $term->nam_hoc_id,
            'nam_hoc' => (string) ($term->namHoc?->nam_hoc ?? ''),
            'hoc_ky' => (string) $term->hoc_ky,
        ];
    }
}
