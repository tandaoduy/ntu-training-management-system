<?php

namespace App\Http\Controllers\Api\Lecturer\GradeEntry;

use App\Http\Controllers\Controller;
use App\Models\CanBo;
use App\Models\DangKyHocPhan;
use App\Models\GradeInputPeriod;
use App\Models\GradeWeightConfig;
use App\Models\HeThongCauHinh;
use App\Models\LopHocPhanDangKy;
use App\Models\StudentGrade;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class GradeEntryController extends Controller
{
    private const DEFAULT_ATTENDANCE_WEIGHT = 10;
    private const DEFAULT_MIDTERM_WEIGHT = 30;
    private const DEFAULT_FINAL_WEIGHT = 60;
    private const GRADE_MODE_NUMERIC = 'numeric';
    private const GRADE_MODE_PASS_FAIL = 'pass_fail';

    public function periods(Request $request): JsonResponse
    {
        $this->currentLecturer($request);

        if (! Schema::hasTable('grade_input_periods')) {
            return $this->jsonResponse(['data' => []]);
        }

        $periods = GradeInputPeriod::query()
            ->with('hocKy.namHoc:id,nam_hoc')
            ->latest('id')
            ->get()
            ->map(fn (GradeInputPeriod $period) => $this->periodPayload($period))
            ->values();

        return $this->jsonResponse(['data' => $periods->all()]);
    }

    public function classes(Request $request): JsonResponse
    {
        $lecturer = $this->currentLecturer($request);
        $payload = $request->validate([
            'hoc_ky_id' => ['nullable', 'integer', 'exists:hoc_kys,id'],
        ]);

        $termId = (int) ($payload['hoc_ky_id'] ?? $this->currentTermId());

        $classesCollection = LopHocPhanDangKy::query()
            ->with([
                'hocKy.namHoc:id,nam_hoc',
                'lopHocPhan:id,hoc_phan_id,hoc_ky_id,giang_vien_id,ma_hoc_phan,ten_hoc_phan,lop_hoc_phan,nhom_hoc_phan,ten_giang_vien,si_so',
                'lopHocPhan.hocPhan:id,so_tin_chi',
                'lopHocPhan.giangVien:id,user_id',
            ])
            ->withCount(['dangKys as so_sinh_vien' => fn ($query) => $query->where('status', 'registered')])
            ->when($termId > 0, fn ($query) => $query->where('hoc_ky_id', $termId))
            ->whereHas('lopHocPhan', fn ($query) => $query->where('giang_vien_id', $lecturer->id))
            ->orderBy('hoc_ky_id')
            ->orderBy('lop_hoc_phan_id')
            ->get();

        $lopHocPhanIds = $classesCollection->pluck('lop_hoc_phan_id')->filter()->unique()->values();
        $preloadedWeights = Schema::hasTable('grade_weight_configs')
            ? GradeWeightConfig::query()->whereIn('lop_hoc_phan_id', $lopHocPhanIds->all())->get()->keyBy('lop_hoc_phan_id')
            : collect();

        $classes = $classesCollection
            ->map(fn (LopHocPhanDangKy $class) => $this->classPayload($class, $preloadedWeights))
            ->values();

        return $this->jsonResponse([
            'data' => $classes->all(),
            'grade_input_period' => $termId > 0 ? $this->periodPayload($this->periodForTerm($termId)) : null,
            'grade_input_open' => $termId > 0 && $this->activePeriodForTerm($termId) !== null,
        ]);
    }

    public function showClass(Request $request, LopHocPhanDangKy $lopHocPhanDangKy): JsonResponse
    {
        $lecturer = $this->currentLecturer($request);
        $this->assertLecturerOwnsClass($lecturer, $lopHocPhanDangKy);

        $lopHocPhanDangKy->load([
            'hocKy.namHoc:id,nam_hoc',
            'lopHocPhan.hocPhan:id,so_tin_chi',
            'lopHocPhan.giangVien:id,user_id',
        ]);

        $students = DangKyHocPhan::query()
            ->with(['sinhVien.lop', 'lopHocPhan.hocPhan', 'lopHocPhanDangKy', 'grade'])
            ->where('lop_hoc_phan_dang_ky_id', $lopHocPhanDangKy->id)
            ->where('status', 'registered')
            ->orderBy('id')
            ->get()
            ->map(fn (DangKyHocPhan $registration) => $this->studentGradePayload($registration))
            ->values();

        return $this->jsonResponse([
            'data' => [
                'class' => $this->classPayload($lopHocPhanDangKy),
                'students' => $students->all(),
                'grade_input_period' => $this->periodPayload($this->periodForTerm($lopHocPhanDangKy->hoc_ky_id)),
                'grade_input_open' => $this->activePeriodForTerm($lopHocPhanDangKy->hoc_ky_id) !== null,
                'weights' => $this->weightPayload($this->weightsForClass($lopHocPhanDangKy, $lecturer)),
            ],
        ]);
    }

    public function saveWeights(Request $request, LopHocPhanDangKy $lopHocPhanDangKy): JsonResponse
    {
        $lecturer = $this->currentLecturer($request);
        $this->assertLecturerOwnsClass($lecturer, $lopHocPhanDangKy);

        $payload = $request->validate([
            'attendance_weight' => ['required', 'numeric', 'min:0', 'max:100'],
            'midterm_weight' => ['required', 'numeric', 'min:0', 'max:100'],
            'final_weight' => ['required', 'numeric', 'min:0', 'max:100'],
            'grade_mode' => ['nullable', Rule::in([self::GRADE_MODE_NUMERIC, self::GRADE_MODE_PASS_FAIL])],
        ]);

        $total = round((float) $payload['attendance_weight'] + (float) $payload['midterm_weight'] + (float) $payload['final_weight'], 2);
        if ($total !== 100.0) {
            return $this->jsonResponse(['message' => 'Tổng trọng số điểm phải bằng 100%.'], 422);
        }

        $config = GradeWeightConfig::query()->updateOrCreate(
            ['lop_hoc_phan_id' => $lopHocPhanDangKy->lop_hoc_phan_id],
            [
                'giang_vien_id' => $lecturer->id,
                'attendance_weight' => round((float) $payload['attendance_weight'], 2),
                'midterm_weight' => round((float) $payload['midterm_weight'], 2),
                'final_weight' => round((float) $payload['final_weight'], 2),
                'grade_mode' => $payload['grade_mode'] ?? self::GRADE_MODE_NUMERIC,
            ],
        );

        $this->recalculateClassGrades($lopHocPhanDangKy, $config);

        return $this->jsonResponse([
            'message' => 'Đã lưu trọng số điểm.',
            'data' => $this->weightPayload($config),
        ]);
    }

    public function saveGrades(Request $request, LopHocPhanDangKy $lopHocPhanDangKy): JsonResponse
    {
        $lecturer = $this->currentLecturer($request);
        $this->assertLecturerOwnsClass($lecturer, $lopHocPhanDangKy);

        if (! $this->activePeriodForTerm($lopHocPhanDangKy->hoc_ky_id)) {
            return $this->jsonResponse(['message' => 'Thời gian nhập điểm chưa mở hoặc đã kết thúc.'], 422);
        }

        $lopHocPhanDangKy->loadMissing('lopHocPhan.hocPhan');
        $isSingleCredit = (int) ($lopHocPhanDangKy->lopHocPhan?->hocPhan?->so_tin_chi ?? 0) === 1;
        $gradeMode = $request->input('grade_mode', self::GRADE_MODE_NUMERIC);
        if ($gradeMode === self::GRADE_MODE_PASS_FAIL && ! $isSingleCredit) {
            return $this->jsonResponse(['message' => 'Kiểu điểm Đạt / Chưa đạt chỉ áp dụng cho học phần 1 tín chỉ.'], 422);
        }

        $scoreRule = $gradeMode === self::GRADE_MODE_PASS_FAIL
            ? ['nullable', Rule::in(['passed', 'failed', 'Đạt', 'Chưa đạt'])]
            : ['nullable', 'numeric', 'min:0', 'max:10', 'regex:/^(?:10(?:\.0{1,2})?|[0-9](?:\.\d{1,2})?)$/'];

        $payload = $request->validate([
            'grade_mode' => ['nullable', Rule::in([self::GRADE_MODE_NUMERIC, self::GRADE_MODE_PASS_FAIL])],
            'grades' => ['required', 'array', 'min:1'],
            'grades.*.dang_ky_hoc_phan_id' => [
                'required',
                'integer',
                Rule::exists('dang_ky_hoc_phans', 'id')->where('lop_hoc_phan_dang_ky_id', $lopHocPhanDangKy->id),
            ],
            'grades.*.attendance_score' => $scoreRule,
            'grades.*.midterm_score' => $scoreRule,
            'grades.*.final_score' => $scoreRule,
            'grades.*.note' => ['nullable', 'string', 'max:255', 'regex:/^[\pL\pN\s]+$/u'],
        ]);

        $saved = DB::transaction(function () use ($payload, $lecturer, $lopHocPhanDangKy, $request, $isSingleCredit) {
            $gradeMode = $payload['grade_mode'] ?? self::GRADE_MODE_NUMERIC;
            $currentWeights = $this->weightsForClass($lopHocPhanDangKy, $lecturer);
            GradeWeightConfig::query()->updateOrCreate(
                ['lop_hoc_phan_id' => $lopHocPhanDangKy->lop_hoc_phan_id],
                [
                    'giang_vien_id' => $lecturer->id,
                    'attendance_weight' => $currentWeights->attendance_weight,
                    'midterm_weight' => $currentWeights->midterm_weight,
                    'final_weight' => $currentWeights->final_weight,
                    'grade_mode' => $gradeMode,
                ],
            );
            $registrationIds = collect($payload['grades'])->pluck('dang_ky_hoc_phan_id')->all();
            $registrations = DangKyHocPhan::query()
                ->whereIn('id', $registrationIds)
                ->where('lop_hoc_phan_dang_ky_id', $lopHocPhanDangKy->id)
                ->where('status', 'registered')
                ->get()
                ->keyBy('id');

            return collect($payload['grades'])
                ->map(function (array $gradePayload) use ($registrations, $lecturer, $lopHocPhanDangKy, $request, $gradeMode, $isSingleCredit) {
                    $registration = $registrations->get((int) $gradePayload['dang_ky_hoc_phan_id']);
                    if (! $registration) {
                        return null;
                    }

                    $weights = $this->weightsForClass($lopHocPhanDangKy, $lecturer);
                    $calculated = $this->calculateGrade(
                        $gradePayload['attendance_score'] ?? null,
                        $gradePayload['midterm_score'] ?? null,
                        $gradePayload['final_score'] ?? null,
                        $weights,
                        $gradeMode,
                        $isSingleCredit,
                    );

                    $grade = StudentGrade::query()->updateOrCreate(
                        ['dang_ky_hoc_phan_id' => $registration->id],
                        [
                            'sinh_vien_id' => $registration->sinh_vien_id,
                            'hoc_ky_id' => $registration->hoc_ky_id,
                            'lop_hoc_phan_id' => $registration->lop_hoc_phan_id,
                            'lop_hoc_phan_dang_ky_id' => $registration->lop_hoc_phan_dang_ky_id,
                            'giang_vien_id' => $lecturer->id,
                            'attendance_score' => $isSingleCredit ? null : $this->nullableScore($gradePayload['attendance_score'] ?? null, $gradeMode),
                            'midterm_score' => $isSingleCredit ? null : $this->nullableScore($gradePayload['midterm_score'] ?? null, $gradeMode),
                            'final_score' => $this->nullableScore($gradePayload['final_score'] ?? null, $gradeMode),
                            'average_score' => $calculated['average_score'],
                            'letter_grade' => $calculated['letter_grade'],
                            'grade_point' => $calculated['grade_point'],
                            'result' => $calculated['result'],
                            'note' => $this->nullableNote($gradePayload['note'] ?? null),
                            'graded_by' => $request->user()?->id,
                            'graded_at' => now(),
                        ],
                    );

                    $registration->setRelation('grade', $grade);

                    return $this->studentGradePayload($registration->loadMissing('sinhVien.lop', 'lopHocPhan.hocPhan'));
                })
                ->filter()
                ->values()
                ->all();
        });

        return $this->jsonResponse([
            'message' => 'Đã lưu điểm sinh viên.',
            'data' => $saved,
        ]);
    }

    private function currentLecturer(Request $request): CanBo
    {
        $user = $request->user();
        $user?->loadMissing('role');
        $user?->syncProfileFromRole();

        if ($user?->role?->code !== 'lecturer') {
            abort(403, 'Tài khoản hiện tại không có quyền nhập điểm.');
        }

        $lecturer = $user->profile instanceof CanBo
            ? $user->profile
            : CanBo::query()->where('user_id', $user->username)->first();

        if (! $lecturer) {
            abort(403, 'Không xác định được thông tin giảng viên.');
        }

        return $lecturer;
    }

    private function assertLecturerOwnsClass(CanBo $lecturer, LopHocPhanDangKy $class): void
    {
        $class->loadMissing('lopHocPhan');

        if ((int) ($class->lopHocPhan?->giang_vien_id ?? 0) !== (int) $lecturer->id) {
            abort(403, 'Giảng viên không phụ trách lớp học phần này.');
        }
    }

    private function calculateGrade(null|float|int|string $attendance, null|float|int|string $midterm, null|float|int|string $final, GradeWeightConfig $weights, ?string $gradeMode = null, bool $isSingleCredit = false): array
    {
        if ($isSingleCredit) {
            if ($final === null || $final === '') {
                return [
                    'average_score' => null,
                    'letter_grade' => null,
                    'grade_point' => null,
                    'result' => 'pending',
                ];
            }

            $gradeMode ??= $weights->grade_mode ?? self::GRADE_MODE_NUMERIC;
            if ($gradeMode === self::GRADE_MODE_PASS_FAIL) {
                $passed = $this->passFailValue($final) === 10.0;

                return [
                    'average_score' => $passed ? 10.0 : 0.0,
                    'letter_grade' => $passed ? 'Đạt' : 'Chưa đạt',
                    'grade_point' => null,
                    'result' => $passed ? 'passed' : 'failed',
                ];
            }

            $average = round((float) $final, 1);

            return $this->numericGradeResult($average);
        }

        $weightedScores = [
            ['score' => $attendance, 'weight' => (float) $weights->attendance_weight],
            ['score' => $midterm, 'weight' => (float) $weights->midterm_weight],
            ['score' => $final, 'weight' => (float) $weights->final_weight],
        ];
        $activeScores = array_values(array_filter($weightedScores, fn (array $item): bool => $item['weight'] > 0));

        if ($activeScores === [] || collect($activeScores)->contains(fn (array $item): bool => $item['score'] === null || $item['score'] === '')) {
            return [
                'average_score' => null,
                'letter_grade' => null,
                'grade_point' => null,
                'result' => 'pending',
            ];
        }

        $gradeMode ??= $weights->grade_mode ?? self::GRADE_MODE_NUMERIC;
        if ($gradeMode === self::GRADE_MODE_PASS_FAIL) {
            $passed = collect($activeScores)->every(fn (array $item): bool => $this->passFailValue($item['score']) === 10.0);

            return [
                'average_score' => $passed ? 10.0 : 0.0,
                'letter_grade' => $passed ? 'Đạt' : 'Chưa đạt',
                'grade_point' => null,
                'result' => $passed ? 'passed' : 'failed',
            ];
        }

        $average = round(collect($activeScores)->reduce(
            fn (float $sum, array $item): float => $sum + ((float) $item['score'] * ($item['weight'] / 100)),
            0.0,
        ), 1);

        return $this->numericGradeResult($average);
    }

    private function numericGradeResult(float $average): array
    {
        if ($average >= 8.5) {
            return ['average_score' => $average, 'letter_grade' => 'A', 'grade_point' => 4.0, 'result' => 'passed'];
        }

        if ($average >= 7.0) {
            return ['average_score' => $average, 'letter_grade' => 'B', 'grade_point' => 3.0, 'result' => 'passed'];
        }

        if ($average >= 5.5) {
            return ['average_score' => $average, 'letter_grade' => 'C', 'grade_point' => 2.0, 'result' => 'passed'];
        }

        if ($average >= 4.0) {
            return ['average_score' => $average, 'letter_grade' => 'D', 'grade_point' => 1.0, 'result' => 'passed'];
        }

        return ['average_score' => $average, 'letter_grade' => 'F', 'grade_point' => 0.0, 'result' => 'failed'];
    }

    private function nullableScore(null|float|int|string $value, ?string $gradeMode = null): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }

        if ($gradeMode === self::GRADE_MODE_PASS_FAIL) {
            return $this->passFailValue($value);
        }

        return round((float) $value, 1);
    }

    private function passFailValue(float|int|string $value): float
    {
        if (in_array($value, ['passed', 'Đạt'], true)) {
            return 10.0;
        }

        return is_numeric($value) && (float) $value >= 10.0 ? 10.0 : 0.0;
    }

    private function nullableNote(mixed $value): ?string
    {
        $note = trim((string) ($value ?? ''));

        return $note === '' ? null : $note;
    }

    private function currentTermId(): int
    {
        $termId = (int) (HeThongCauHinh::query()->find('current_hoc_ky_id')?->value ?? 0);
        if ($termId <= 0) {
            $termId = (int) (HeThongCauHinh::query()->find('current_academic_term_id')?->value ?? 0);
        }

        return $termId;
    }

    private function activePeriodForTerm(int $termId): ?GradeInputPeriod
    {
        if (! Schema::hasTable('grade_input_periods')) {
            return null;
        }

        return GradeInputPeriod::query()
            ->with('hocKy.namHoc:id,nam_hoc')
            ->where('hoc_ky_id', $termId)
            ->where('status', 'open')
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>=', now())
            ->latest('id')
            ->first();
    }

    private function periodForTerm(int $termId): ?GradeInputPeriod
    {
        if (! Schema::hasTable('grade_input_periods')) {
            return null;
        }

        return GradeInputPeriod::query()
            ->with('hocKy.namHoc:id,nam_hoc')
            ->where('hoc_ky_id', $termId)
            ->latest('id')
            ->first();
    }

    private function classPayload(LopHocPhanDangKy $class, ?object $preloadedWeights = null): array
    {
        $section = $class->lopHocPhan;
        $weights = null;
        if (Schema::hasTable('grade_weight_configs')) {
            $weights = $preloadedWeights !== null
                ? $preloadedWeights->get($class->lop_hoc_phan_id)
                : GradeWeightConfig::query()->where('lop_hoc_phan_id', $class->lop_hoc_phan_id)->first();
        }

        return [
            'id' => $class->id,
            'hoc_ky_id' => $class->hoc_ky_id,
            'lop_hoc_phan_id' => $class->lop_hoc_phan_id,
            'ma_hoc_phan' => $section?->ma_hoc_phan,
            'ten_hoc_phan' => $section?->ten_hoc_phan,
            'so_tin_chi' => (int) ($section?->hocPhan?->so_tin_chi ?? 0),
            'lop_hoc_phan' => $section?->lop_hoc_phan,
            'nhom_hoc_phan' => $section?->nhom_hoc_phan,
            'ten_giang_vien' => $section?->ten_giang_vien,
            'ma_can_bo' => $section?->giangVien?->user_id,
            'si_so' => (int) ($section?->si_so ?? 0),
            'so_sinh_vien' => (int) ($class->so_sinh_vien ?? 0),
            'status' => $class->status,
            'term' => $class->hocKy ? [
                'hoc_ky' => $class->hocKy->hoc_ky,
                'nam_hoc' => $class->hocKy->namHoc?->nam_hoc,
            ] : null,
            'weights' => $weights
                ? $this->weightPayload($weights)
                : [
                    'attendance_weight' => self::DEFAULT_ATTENDANCE_WEIGHT,
                    'midterm_weight' => self::DEFAULT_MIDTERM_WEIGHT,
                    'final_weight' => self::DEFAULT_FINAL_WEIGHT,
                    'grade_mode' => self::GRADE_MODE_NUMERIC,
                ],
        ];
    }

    private function studentGradePayload(DangKyHocPhan $registration): array
    {
        $student = $registration->sinhVien;
        $grade = $registration->grade;

        return [
            'dang_ky_hoc_phan_id' => $registration->id,
            'sinh_vien_id' => $student?->id,
            'ma_sinh_vien' => $student?->user_id,
            'ho_ten' => $student?->ten_sinh_vien,
            'ma_lop' => $student?->ma_lop ?? $student?->lop?->lop_hoc_phan,
            'ngay_sinh' => $student?->ngay_sinh ? (string) $student->ngay_sinh : null,
            'attendance_score' => $grade?->attendance_score,
            'midterm_score' => $grade?->midterm_score,
            'final_score' => $grade?->final_score,
            'average_score' => $grade?->average_score,
            'letter_grade' => $grade?->letter_grade,
            'grade_point' => $grade?->grade_point,
            'result' => $grade?->result ?? 'pending',
            'note' => $grade?->note,
            'graded_at' => $grade?->graded_at?->toISOString(),
        ];
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

    private function weightsForClass(LopHocPhanDangKy $class, CanBo $lecturer): GradeWeightConfig
    {
        if (! Schema::hasTable('grade_weight_configs')) {
            return new GradeWeightConfig([
                'lop_hoc_phan_id' => $class->lop_hoc_phan_id,
                'giang_vien_id' => $lecturer->id,
                'attendance_weight' => self::DEFAULT_ATTENDANCE_WEIGHT,
                'midterm_weight' => self::DEFAULT_MIDTERM_WEIGHT,
                'final_weight' => self::DEFAULT_FINAL_WEIGHT,
            ]);
        }

        return GradeWeightConfig::query()->firstOrCreate(
            ['lop_hoc_phan_id' => $class->lop_hoc_phan_id],
            [
                'giang_vien_id' => $lecturer->id,
                'attendance_weight' => self::DEFAULT_ATTENDANCE_WEIGHT,
                'midterm_weight' => self::DEFAULT_MIDTERM_WEIGHT,
                'final_weight' => self::DEFAULT_FINAL_WEIGHT,
                'grade_mode' => self::GRADE_MODE_NUMERIC,
            ],
        );
    }

    private function weightPayload(GradeWeightConfig $config): array
    {
        return [
            'attendance_weight' => (float) $config->attendance_weight,
            'midterm_weight' => (float) $config->midterm_weight,
            'final_weight' => (float) $config->final_weight,
            'grade_mode' => $config->grade_mode ?? self::GRADE_MODE_NUMERIC,
        ];
    }

    private function recalculateClassGrades(LopHocPhanDangKy $class, GradeWeightConfig $weights): void
    {
        StudentGrade::query()
            ->where('lop_hoc_phan_dang_ky_id', $class->id)
            ->get()
            ->each(function (StudentGrade $grade) use ($class, $weights): void {
                $class->loadMissing('lopHocPhan.hocPhan');
                $calculated = $this->calculateGrade(
                    $grade->attendance_score,
                    $grade->midterm_score,
                    $grade->final_score,
                    $weights,
                    $weights->grade_mode ?? self::GRADE_MODE_NUMERIC,
                    (int) ($class->lopHocPhan?->hocPhan?->so_tin_chi ?? 0) === 1,
                );

                $grade->fill([
                    'average_score' => $calculated['average_score'],
                    'letter_grade' => $calculated['letter_grade'],
                    'grade_point' => $calculated['grade_point'],
                    'result' => $calculated['result'],
                ])->save();
            });
    }
}
