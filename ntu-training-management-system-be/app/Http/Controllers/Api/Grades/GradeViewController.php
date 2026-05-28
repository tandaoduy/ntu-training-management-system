<?php

namespace App\Http\Controllers\Api\Grades;

use App\Http\Controllers\Controller;
use App\Models\ChuyenVien;
use App\Models\DangKyHocPhan;
use App\Models\GradeWeightConfig;
use App\Models\HocPhan;
use App\Models\LopHocPhan;
use App\Models\LopHocPhanDangKy;
use App\Models\QuanLy;
use App\Models\SinhVien;
use App\Models\StudentGrade;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class GradeViewController extends Controller
{
    public function student(Request $request): JsonResponse
    {
        $student = $this->currentStudent($request);
        $termId = (int) $request->query('hoc_ky_id', 0);

        $grades = DangKyHocPhan::query()
            ->with([
                'sinhVien.lop',
                'lopHocPhan.hocPhan',
                'lopHocPhan.giangVien',
                'lopHocPhanDangKy',
                'lopHocPhanDangKy.hocKy.namHoc:id,nam_hoc',
                'grade',
                'grade.hocKy.namHoc:id,nam_hoc',
            ])
            ->where('sinh_vien_id', $student->id)
            ->where('status', 'registered')
            ->when($termId > 0, fn ($query) => $query->where('hoc_ky_id', $termId))
            ->orderBy('hoc_ky_id')
            ->orderBy('lop_hoc_phan_id')
            ->get()
            ->map(fn (DangKyHocPhan $registration) => $this->registrationGradePayload($registration))
            ->values();

        return $this->jsonResponse(['data' => $grades->all()]);
    }

    public function trainingOfficer(Request $request): JsonResponse
    {
        $this->assertRole($request, 'training_officer');
        $termId = (int) $request->query('hoc_ky_id', 0);

        $grades = $this->baseRegistrationQuery()
            ->when($termId > 0, fn ($query) => $query->where('hoc_ky_id', $termId))
            ->get()
            ->map(fn (DangKyHocPhan $registration) => $this->registrationGradePayload($registration))
            ->values();

        return $this->jsonResponse(['data' => $grades->all()]);
    }

    public function manager(Request $request): JsonResponse
    {
        $manager = $this->currentManager($request);
        $termId = (int) $request->query('hoc_ky_id', 0);

        if (! $manager->don_vi_id) {
            return $this->jsonResponse(['data' => []]);
        }

        $grades = $this->baseRegistrationQuery()
            ->when($termId > 0, fn ($query) => $query->where('hoc_ky_id', $termId))
            ->whereHas('lopHocPhan.hocPhan', fn ($courseQuery) => $courseQuery->where('don_vi_id', $manager->don_vi_id))
            ->get()
            ->map(fn (DangKyHocPhan $registration) => $this->registrationGradePayload($registration))
            ->values();

        return $this->jsonResponse(['data' => $grades->all()]);
    }

    public function trainingOfficerStudent(Request $request, string $code): JsonResponse
    {
        $this->assertRole($request, 'training_officer');

        return $this->studentLookupResponse($code);
    }

    public function updateByTrainingOfficer(Request $request, DangKyHocPhan $dangKyHocPhan): JsonResponse
    {
        $this->assertRole($request, 'training_officer');

        $payload = $request->validate([
            'attendance_score' => ['nullable', 'numeric', 'min:0', 'max:10'],
            'midterm_score' => ['nullable', 'numeric', 'min:0', 'max:10'],
            'final_score' => ['nullable', 'numeric', 'min:0', 'max:10'],
            'average_score' => ['required', 'numeric', 'min:0', 'max:10'],
            'note' => ['nullable', 'string', 'max:255'],
        ]);

        $dangKyHocPhan->loadMissing('lopHocPhan.hocPhan', 'lopHocPhanDangKy');
        $average = round((float) $payload['average_score'], 1);
        $calculated = $this->numericGradeResult($average);

        $grade = StudentGrade::query()->updateOrCreate(
            ['dang_ky_hoc_phan_id' => $dangKyHocPhan->id],
            [
                'sinh_vien_id' => $dangKyHocPhan->sinh_vien_id,
                'hoc_ky_id' => $dangKyHocPhan->hoc_ky_id,
                'lop_hoc_phan_id' => $dangKyHocPhan->lop_hoc_phan_id,
                'lop_hoc_phan_dang_ky_id' => $dangKyHocPhan->lop_hoc_phan_dang_ky_id,
                'giang_vien_id' => $dangKyHocPhan->lopHocPhan?->giang_vien_id,
                'attendance_score' => $this->nullableScore($payload['attendance_score'] ?? null),
                'midterm_score' => $this->nullableScore($payload['midterm_score'] ?? null),
                'final_score' => $this->nullableScore($payload['final_score'] ?? null),
                'average_score' => $average,
                'letter_grade' => $calculated['letter_grade'],
                'grade_point' => $calculated['grade_point'],
                'result' => $calculated['result'],
                'note' => trim((string) ($payload['note'] ?? '')) ?: null,
                'graded_by' => $request->user()?->id,
                'graded_at' => now(),
            ],
        );

        $dangKyHocPhan->setRelation('grade', $grade);

        return $this->jsonResponse([
            'message' => 'Đã cập nhật điểm sinh viên.',
            'data' => $this->registrationGradePayload($dangKyHocPhan->fresh([
                'sinhVien.lop',
                'lopHocPhan.hocPhan',
                'lopHocPhan.giangVien',
                'lopHocPhanDangKy',
                'lopHocPhanDangKy.hocKy.namHoc:id,nam_hoc',
                'grade',
                'grade.hocKy.namHoc:id,nam_hoc',
            ])),
        ]);
    }

    public function addCompletedCourse(Request $request, string $code): JsonResponse
    {
        $this->assertRole($request, 'training_officer');

        $student = SinhVien::query()->where('user_id', $code)->firstOrFail();
        $payload = $request->validate([
            'ma_hoc_phan' => ['required', 'string', Rule::exists('hoc_phans', 'ma_hoc_phan')],
            'hoc_ky_id' => ['required', 'integer', 'exists:hoc_kys,id'],
            'note' => ['nullable', 'string', 'max:255'],
        ]);

        $registration = DB::transaction(function () use ($student, $payload, $request): DangKyHocPhan {
            $course = HocPhan::query()->where('ma_hoc_phan', $payload['ma_hoc_phan'])->firstOrFail();
            $termId = (int) $payload['hoc_ky_id'];
            $classSection = LopHocPhan::query()->firstOrCreate([
                'hoc_phan_id' => $course->id,
                'hoc_ky_id' => $termId,
                'lop_hoc_phan' => 'MIEN_HOAN_THANH',
                'nhom_hoc_phan' => 'MH',
            ], [
                'ma_hoc_phan' => $course->ma_hoc_phan,
                'ten_hoc_phan' => $course->ten_hoc_phan,
                'ten_giang_vien' => 'Miễn',
                'si_so' => 0,
                'trang_thai' => true,
            ]);
            $classSection->forceFill(['ten_giang_vien' => 'Miễn'])->save();

            GradeWeightConfig::query()->updateOrCreate(
                ['lop_hoc_phan_id' => $classSection->id],
                [
                    'giang_vien_id' => null,
                    'attendance_weight' => 0,
                    'midterm_weight' => 0,
                    'final_weight' => 100,
                    'grade_mode' => 'pass_fail',
                ],
            );

            $classRegistration = LopHocPhanDangKy::query()->firstOrCreate([
                'hoc_ky_id' => $termId,
                'lop_hoc_phan_id' => $classSection->id,
            ], [
                'si_so_toi_da' => 0,
                'status' => 'closed',
            ]);

            $registration = DangKyHocPhan::query()->updateOrCreate([
                'sinh_vien_id' => $student->id,
                'hoc_ky_id' => $termId,
                'ma_hoc_phan' => $course->ma_hoc_phan,
            ], [
                'lop_hoc_phan_dang_ky_id' => $classRegistration->id,
                'lop_hoc_phan_id' => $classSection->id,
                'status' => 'registered',
                'registered_at' => now(),
            ]);

            StudentGrade::query()->updateOrCreate(
                ['dang_ky_hoc_phan_id' => $registration->id],
                [
                    'sinh_vien_id' => $student->id,
                    'hoc_ky_id' => $termId,
                    'lop_hoc_phan_id' => $classSection->id,
                    'lop_hoc_phan_dang_ky_id' => $classRegistration->id,
                    'giang_vien_id' => null,
                    'attendance_score' => null,
                    'midterm_score' => null,
                    'final_score' => 10,
                    'average_score' => 10,
                    'letter_grade' => 'Miễn',
                    'grade_point' => null,
                    'result' => 'passed',
                    'note' => trim((string) ($payload['note'] ?? 'Miễn')) ?: 'Miễn',
                    'graded_by' => $request->user()?->id,
                    'graded_at' => now(),
                ],
            );

            return $registration;
        });

        return $this->jsonResponse([
            'message' => 'Đã thêm học phần miễn/hoàn thành vào bảng điểm.',
            'data' => $this->registrationGradePayload($registration->fresh([
                'sinhVien.lop',
                'lopHocPhan.hocPhan',
                'lopHocPhan.giangVien',
                'lopHocPhanDangKy',
                'lopHocPhanDangKy.hocKy.namHoc:id,nam_hoc',
                'grade',
                'grade.hocKy.namHoc:id,nam_hoc',
            ])),
        ], 201);
    }

    public function managerStudent(Request $request, string $code): JsonResponse
    {
        $manager = $this->currentManager($request);

        if (! $manager->don_vi_id) {
            return $this->jsonResponse(['data' => [], 'student' => null]);
        }

        $student = SinhVien::query()
            ->with('lop')
            ->where('user_id', $code)
            ->where('don_vi_id', $manager->don_vi_id)
            ->first();

        return $this->studentLookupResponse($code, $student, $manager->don_vi_id);
    }

    private function baseGradeQuery()
    {
        return StudentGrade::query()
            ->with([
                'sinhVien.lop',
                'hocKy.namHoc:id,nam_hoc',
                'lopHocPhan.hocPhan',
                'lopHocPhan.giangVien',
                'registration',
            ])
            ->orderBy('hoc_ky_id')
            ->orderBy('lop_hoc_phan_id')
            ->orderBy('sinh_vien_id');
    }

    private function baseRegistrationQuery()
    {
        return DangKyHocPhan::query()
            ->with([
                'sinhVien.lop',
                'lopHocPhan.hocPhan',
                'lopHocPhan.giangVien',
                'lopHocPhanDangKy',
                'lopHocPhanDangKy.hocKy.namHoc:id,nam_hoc',
                'grade',
                'grade.hocKy.namHoc:id,nam_hoc',
            ])
            ->where('status', 'registered')
            ->orderBy('hoc_ky_id')
            ->orderBy('lop_hoc_phan_id')
            ->orderBy('sinh_vien_id');
    }

    private function currentStudent(Request $request): SinhVien
    {
        $request->user()?->loadMissing('role');
        $request->user()?->syncProfileFromRole();

        if ($request->user()?->role?->code !== 'student') {
            abort(403, 'Tài khoản hiện tại không có quyền xem điểm sinh viên.');
        }

        $student = $request->user()?->profile instanceof SinhVien
            ? $request->user()->profile
            : SinhVien::query()->where('user_id', $request->user()?->username)->first();

        if (! $student) {
            abort(403, 'Không xác định được sinh viên.');
        }

        return $student;
    }

    private function currentManager(Request $request): QuanLy
    {
        $request->user()?->loadMissing('role');
        $request->user()?->syncProfileFromRole();

        if ($request->user()?->role?->code !== 'manager') {
            abort(403, 'Tài khoản hiện tại không có quyền xem điểm quản lý.');
        }

        $manager = $request->user()?->profile instanceof QuanLy
            ? $request->user()->profile
            : QuanLy::query()->where('user_id', $request->user()?->username)->first();

        if (! $manager) {
            abort(403, 'Không xác định được người quản lý.');
        }

        return $manager;
    }

    private function assertRole(Request $request, string $role): void
    {
        $request->user()?->loadMissing('role');
        $request->user()?->syncProfileFromRole();

        if ($request->user()?->role?->code !== $role) {
            abort(403, 'Tài khoản hiện tại không có quyền xem điểm.');
        }

        if ($role === 'training_officer' && ! ($request->user()?->profile instanceof ChuyenVien)) {
            ChuyenVien::query()->where('user_id', $request->user()?->username)->firstOrFail();
        }
    }

    private function gradePayload(StudentGrade $grade): array
    {
        $student = $grade->sinhVien;
        $section = $grade->lopHocPhan;
        $weights = GradeWeightConfig::query()
            ->where('lop_hoc_phan_id', $grade->lop_hoc_phan_id)
            ->first();

        return [
            'id' => $grade->id,
            'hoc_ky_id' => $grade->hoc_ky_id,
            'nam_hoc_id' => $grade->hocKy?->nam_hoc_id,
            'nam_hoc' => $grade->hocKy?->namHoc?->nam_hoc,
            'hoc_ky' => $grade->hocKy?->hoc_ky,
            'ma_sinh_vien' => $student?->user_id,
            'ho_ten' => $student?->ten_sinh_vien,
            'ma_lop' => $student?->ma_lop ?? $student?->lop?->lop_hoc_phan,
            'ten_nganh_hoc' => $student?->ten_nganh_hoc,
            'ma_hoc_phan' => $section?->ma_hoc_phan,
            'ten_hoc_phan' => $section?->ten_hoc_phan,
            'so_tin_chi' => (int) ($section?->hocPhan?->so_tin_chi ?? 0),
            'lop_hoc_phan' => $section?->lop_hoc_phan,
            'nhom_hoc_phan' => $section?->nhom_hoc_phan,
            'ten_giang_vien' => $section?->ten_giang_vien,
            'attendance_score' => $grade->attendance_score,
            'midterm_score' => $grade->midterm_score,
            'final_score' => $grade->final_score,
            'average_score' => $grade->average_score,
            'letter_grade' => $grade->letter_grade,
            'grade_point' => $grade->grade_point,
            'result' => $grade->result,
            'note' => $grade->note,
            'exempt_grade' => $this->isExemptGrade($grade),
            'grade_mode' => $weights?->grade_mode ?? 'numeric',
            'graded_at' => $grade->graded_at?->toISOString(),
        ];
    }

    private function studentLookupResponse(string $code, ?SinhVien $student = null, ?int $unitId = null): JsonResponse
    {
        $student ??= SinhVien::query()
            ->with('lop')
            ->where('user_id', $code)
            ->first();

        if (! $student) {
            return $this->jsonResponse(['data' => [], 'student' => null]);
        }

        $grades = DangKyHocPhan::query()
            ->with([
                'sinhVien.lop',
                'lopHocPhan.hocPhan',
                'lopHocPhan.giangVien',
                'lopHocPhanDangKy',
                'lopHocPhanDangKy.hocKy.namHoc:id,nam_hoc',
                'grade',
                'grade.hocKy.namHoc:id,nam_hoc',
            ])
            ->where('sinh_vien_id', $student->id)
            ->where('status', 'registered')
            ->when($unitId, fn ($query) => $query->whereHas('lopHocPhan.hocPhan', fn ($courseQuery) => $courseQuery->where('don_vi_id', $unitId)))
            ->orderBy('hoc_ky_id')
            ->orderBy('lop_hoc_phan_id')
            ->get()
            ->map(fn (DangKyHocPhan $registration) => $this->registrationGradePayload($registration))
            ->values();

        return $this->jsonResponse([
            'data' => $grades->all(),
            'student' => $this->studentPayload($student),
        ]);
    }

    private function studentPayload(SinhVien $student): array
    {
        return [
            'ma_sinh_vien' => $student->user_id,
            'ho_ten' => $student->ten_sinh_vien,
            'ma_lop' => $student->ma_lop ?? $student->lop?->lop_hoc_phan,
            'ten_nganh_hoc' => $student->ten_nganh_hoc,
        ];
    }

    private function registrationGradePayload(DangKyHocPhan $registration): array
    {
        $grade = $registration->grade;
        $student = $registration->sinhVien;
        $section = $registration->lopHocPhan;
        $term = $grade?->hocKy ?? $registration->lopHocPhanDangKy?->hocKy;
        $term?->loadMissing('namHoc:id,nam_hoc');
        $weights = GradeWeightConfig::query()
            ->where('lop_hoc_phan_id', $registration->lop_hoc_phan_id)
            ->first();

        return [
            'id' => $grade?->id ?? ($registration->id * -1),
            'dang_ky_hoc_phan_id' => $registration->id,
            'hoc_ky_id' => $registration->hoc_ky_id,
            'nam_hoc_id' => $term?->nam_hoc_id,
            'nam_hoc' => $term?->namHoc?->nam_hoc,
            'hoc_ky' => $term?->hoc_ky,
            'ma_sinh_vien' => $student?->user_id,
            'ho_ten' => $student?->ten_sinh_vien,
            'ma_lop' => $student?->ma_lop ?? $student?->lop?->lop_hoc_phan,
            'ten_nganh_hoc' => $student?->ten_nganh_hoc,
            'ma_hoc_phan' => $section?->ma_hoc_phan,
            'ten_hoc_phan' => $section?->ten_hoc_phan,
            'so_tin_chi' => (int) ($section?->hocPhan?->so_tin_chi ?? 0),
            'lop_hoc_phan' => $section?->lop_hoc_phan,
            'nhom_hoc_phan' => $section?->nhom_hoc_phan,
            'ten_giang_vien' => $section?->ten_giang_vien,
            'attendance_score' => $grade?->attendance_score,
            'midterm_score' => $grade?->midterm_score,
            'final_score' => $grade?->final_score,
            'attendance_weight' => (float) ($weights?->attendance_weight ?? 0),
            'midterm_weight' => (float) ($weights?->midterm_weight ?? 0),
            'final_weight' => (float) ($weights?->final_weight ?? 100),
            'average_score' => $grade?->average_score,
            'letter_grade' => $grade?->letter_grade,
            'grade_point' => $grade?->grade_point,
            'result' => $grade?->result ?? 'pending',
            'note' => $grade?->note,
            'exempt_grade' => $grade ? $this->isExemptGrade($grade) : false,
            'grade_mode' => $weights?->grade_mode ?? 'numeric',
            'graded_at' => $grade?->graded_at?->toISOString(),
        ];
    }

    private function nullableScore(mixed $value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }

        return round((float) $value, 1);
    }

    private function isExemptGrade(StudentGrade $grade): bool
    {
        return str_contains((string) $grade->letter_grade, 'Miễn')
            || str_contains((string) $grade->note, 'Miễn')
            || ($grade->grade_point === null && $grade->result === 'passed' && (float) $grade->average_score >= 10.0);
    }

    private function numericGradeResult(float $average): array
    {
        if ($average >= 8.5) {
            return ['letter_grade' => 'A', 'grade_point' => 4.0, 'result' => 'passed'];
        }

        if ($average >= 7.0) {
            return ['letter_grade' => 'B', 'grade_point' => 3.0, 'result' => 'passed'];
        }

        if ($average >= 5.5) {
            return ['letter_grade' => 'C', 'grade_point' => 2.0, 'result' => 'passed'];
        }

        if ($average >= 4.0) {
            return ['letter_grade' => 'D', 'grade_point' => 1.0, 'result' => 'passed'];
        }

        return ['letter_grade' => 'F', 'grade_point' => 0.0, 'result' => 'failed'];
    }

    private function jsonResponse(array $payload, int $status = 200): JsonResponse
    {
        return response()->json($payload, $status, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}
