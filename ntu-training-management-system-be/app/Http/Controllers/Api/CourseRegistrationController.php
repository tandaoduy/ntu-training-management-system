<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CauHinhTuanHoc;
use App\Models\DangKyHocPhan;
use App\Models\HeThongCauHinh;
use App\Models\HocKy;
use App\Models\HocPhanDangKyDotDangKy;
use App\Models\LopHocPhan;
use App\Models\LopHocPhanDangKy;
use App\Models\NganhDaoTao;
use App\Models\SinhVien;
use App\Models\ThoiKhoaBieu;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CourseRegistrationController extends Controller
{
    private function jsonResponse(array $payload, int $status = 200): JsonResponse
    {
        return response()->json($payload, $status, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    public function periods(): JsonResponse
    {
        $periods = HocPhanDangKyDotDangKy::query()
            ->with('hocKy.namHoc:id,nam_hoc')
            ->latest('id')
            ->get()
            ->map(fn (HocPhanDangKyDotDangKy $period) => $this->periodPayload($period))
            ->values();

        return $this->jsonResponse(['data' => $periods->all()]);
    }

    public function storePeriod(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'hoc_ky_id' => ['required', 'integer', 'exists:hoc_kys,id'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'status' => ['nullable', 'string', 'in:open,closed'],
        ]);

        $period = HocPhanDangKyDotDangKy::query()->create([
            'hoc_ky_id' => (int) $payload['hoc_ky_id'],
            'starts_at' => Carbon::parse($payload['starts_at']),
            'ends_at' => Carbon::parse($payload['ends_at']),
            'status' => $payload['status'] ?? 'open',
        ]);

        return $this->jsonResponse([
            'message' => 'Đã cấu hình thời gian đăng ký học phần.',
            'data' => $this->periodPayload($period->load('hocKy.namHoc:id,nam_hoc')),
        ], 201);
    }

    public function officerClasses(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'hoc_ky_id' => ['nullable', 'integer', 'exists:hoc_kys,id'],
        ]);

        $currentTermId = $this->currentTermId();
        $termId = $currentTermId > 0 ? $currentTermId : ($payload['hoc_ky_id'] ?? $this->latestTimetableTermId());
        if ($termId) {
            $this->syncClassRegistrations((int) $termId);
        }

        if (! $termId) {
            return $this->jsonResponse(['data' => []]);
        }

        $classes = LopHocPhanDangKy::query()
            ->with([
                'lopHocPhan:id,hoc_phan_id,hoc_ky_id,lop_hanh_chinh_id,ma_hoc_phan,ten_hoc_phan,lop_hoc_phan,nhom_hoc_phan,ten_giang_vien,si_so',
                'lopHocPhan.hocPhan:id,so_tin_chi',
                'hocKy.namHoc:id,nam_hoc',
            ])
            ->withCount(['dangKys as so_sv_da_dk' => fn ($query) => $query->where('status', 'registered')])
            ->when($termId, fn ($query) => $query->where('hoc_ky_id', $termId))
            ->orderBy(LopHocPhan::query()->select('ma_hoc_phan')->whereColumn('lop_hoc_phans.id', 'lop_hoc_phan_dang_kys.lop_hoc_phan_id'))
            ->orderBy(LopHocPhan::query()->select('nhom_hoc_phan')->whereColumn('lop_hoc_phans.id', 'lop_hoc_phan_dang_kys.lop_hoc_phan_id'))
            ->get()
            ->map(fn (LopHocPhanDangKy $item) => $this->classPayload($item))
            ->values();

        return $this->jsonResponse(['data' => $classes->all()]);
    }

    public function updateClass(Request $request, LopHocPhanDangKy $lopHocPhanDangKy): JsonResponse
    {
        $payload = $request->validate([
            'si_so_toi_da' => ['required', 'integer', 'min:0', 'max:10000'],
            'status' => ['nullable', 'string', 'in:open,closed'],
        ]);

        $lopHocPhanDangKy->fill([
            'si_so_toi_da' => (int) $payload['si_so_toi_da'],
            'status' => $payload['status'] ?? $lopHocPhanDangKy->status,
        ])->save();

        return $this->jsonResponse([
            'message' => 'Đã cập nhật chỉ tiêu đăng ký.',
            'data' => $this->classPayload($lopHocPhanDangKy->fresh(['lopHocPhan.hocPhan', 'hocKy.namHoc'])->loadCount(['dangKys as so_sv_da_dk' => fn ($query) => $query->where('status', 'registered')])),
        ]);
    }

    public function deleteClass(LopHocPhanDangKy $lopHocPhanDangKy): JsonResponse
    {
        $lopHocPhanDangKy->delete();

        return $this->jsonResponse([
            'message' => 'Đã xóa lớp học phần đăng ký.',
        ]);
    }

    public function addStudentToClass(Request $request, LopHocPhanDangKy $lopHocPhanDangKy): JsonResponse
    {
        $payload = $request->validate([
            'ma_sinh_vien' => ['required', 'regex:/^\d{8}$/', 'exists:sinh_viens,user_id'],
        ]);

        $lopHocPhanDangKy->loadMissing('lopHocPhan.hocPhan');
        $student = SinhVien::query()->where('user_id', $payload['ma_sinh_vien'])->firstOrFail();
        $section = $lopHocPhanDangKy->lopHocPhan;

        if (! $section) {
            return $this->jsonResponse(['message' => 'Lớp học phần không còn tồn tại.'], 422);
        }

        $existingRegistration = DangKyHocPhan::query()
            ->where('sinh_vien_id', $student->id)
            ->where('hoc_ky_id', $lopHocPhanDangKy->hoc_ky_id)
            ->where('ma_hoc_phan', $section->ma_hoc_phan)
            ->first();

        $this->assertNoScheduleConflict(
            $student,
            $lopHocPhanDangKy->hoc_ky_id,
            $section->id,
            $existingRegistration?->id,
        );

        $registration = DangKyHocPhan::query()->updateOrCreate([
            'sinh_vien_id' => $student->id,
            'hoc_ky_id' => $lopHocPhanDangKy->hoc_ky_id,
            'ma_hoc_phan' => $section->ma_hoc_phan,
        ], [
            'lop_hoc_phan_dang_ky_id' => $lopHocPhanDangKy->id,
            'lop_hoc_phan_id' => $section->id,
            'status' => 'registered',
            'registered_at' => now(),
        ]);

        return $this->jsonResponse([
            'message' => 'Đã thêm sinh viên vào lớp học phần.',
            'data' => $this->registrationPayload($registration->fresh(['lopHocPhanDangKy.lopHocPhan.hocPhan'])),
        ], 201);
    }

    public function studentStatus(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'hoc_ky_id' => ['nullable', 'integer', 'exists:hoc_kys,id'],
        ]);
        $student = $this->currentStudent($request);
        $currentTermId = $this->currentTermId();
        $period = $this->activePeriod();
        $displayPeriod = $period ?? ($currentTermId > 0 ? $this->periodForTerm($currentTermId) : null);
        $requestedTermId = (int) ($payload['hoc_ky_id'] ?? 0);
        if ($currentTermId > 0 && $requestedTermId !== $currentTermId) {
            $requestedTermId = 0;
        }
        $requestedTerm = $requestedTermId > 0
            ? HocKy::query()->with('namHoc:id,nam_hoc')->find($requestedTermId)
            : null;

        $timetableTermId = $requestedTerm?->id ?? ($period?->hoc_ky_id ?? ($currentTermId > 0 ? $currentTermId : ($displayPeriod?->hoc_ky_id ?? 0)));

        $timetableRegistrations = $this->registeredRegistrationsForTimetable($student, $timetableTermId);

        if (! $displayPeriod && ! $requestedTerm) {
            return $this->jsonResponse([
                'data' => [
                    'registration_period' => null,
                    'registration_open' => false,
                    'student_academic_info' => $this->studentAcademicInfoPayload($student),
                    'courses' => [],
                    'registrations' => [],
                    'student_timetable' => [],
                    'message' => 'Chưa có đợt đăng ký học phần đang mở.',
                ],
            ]);
        }

        if (! $displayPeriod && $requestedTerm) {
            return $this->jsonResponse([
                'data' => [
                    'registration_period' => $this->termOnlyPeriodPayload($requestedTerm),
                    'registration_open' => false,
                    'student_class_id' => $student->lop_id,
                    'student_academic_info' => $this->studentAcademicInfoPayload($student),
                    'courses' => [],
                    'registrations' => [],
                    'student_timetable' => $this->studentTimetablePayload($timetableTermId, $timetableRegistrations),
                    'message' => null,
                ],
            ]);
        }

        $selectedTermId = $requestedTerm?->id ?? $displayPeriod->hoc_ky_id;
        $this->syncClassRegistrations($selectedTermId);
        $plannedCourseCodes = $this->approvedStudyPlanCourseCodes($student, $selectedTermId);

        $registrations = DangKyHocPhan::query()
            ->with('lopHocPhanDangKy.lopHocPhan.hocPhan', 'lopHocPhan.hocPhan')
            ->where('sinh_vien_id', $student->id)
            ->where('hoc_ky_id', $selectedTermId)
            ->whereIn('status', ['pending', 'registered'])
            ->when(
                ! empty($plannedCourseCodes),
                fn ($query) => $query->whereIn('ma_hoc_phan', $plannedCourseCodes),
                fn ($query) => $query->whereRaw('1 = 0')
            )
            ->get();

        $classes = LopHocPhanDangKy::query()
            ->with('lopHocPhan.hocPhan')
            ->withCount(['dangKys as so_sv_da_dk' => fn ($query) => $query->where('status', 'registered')])
            ->where('hoc_ky_id', $selectedTermId)
            ->where('status', 'open')
            ->when(
                ! empty($plannedCourseCodes),
                fn ($query) => $query->whereHas('lopHocPhan', fn ($sectionQuery) => $sectionQuery->whereIn('ma_hoc_phan', $plannedCourseCodes)),
                fn ($query) => $query->whereRaw('1 = 0')
            )
            ->get();

        $registeredCourseCodes = $registrations->where('status', 'registered')->pluck('ma_hoc_phan')->all();
        $registrationIdsByCourse = $registrations
            ->mapWithKeys(fn (DangKyHocPhan $item) => [$item->ma_hoc_phan => $item->id])
            ->all();
        $courses = $classes
            ->groupBy(fn (LopHocPhanDangKy $item) => $item->lopHocPhan?->ma_hoc_phan ?? '')
            ->filter(fn ($items, $courseCode) => $courseCode !== '')
            ->map(function ($items, string $courseCode) use ($student, $registeredCourseCodes, $registrationIdsByCourse, $selectedTermId) {
                $first = $items->first()->lopHocPhan;
                $ignoreRegistrationId = $registrationIdsByCourse[$courseCode] ?? null;
                $options = $items
                    ->sortBy([
                        fn (LopHocPhanDangKy $item) => $item->lopHocPhan?->nhom_hoc_phan ?? '',
                        fn (LopHocPhanDangKy $item) => $item->lopHocPhan?->lop_hoc_phan ?? '',
                    ])
                    ->map(fn (LopHocPhanDangKy $item) => $this->studentClassOptionPayload($item, $student, $selectedTermId, $ignoreRegistrationId))
                    ->values();

                return [
                    'ma_hoc_phan' => $courseCode,
                    'ten_hoc_phan' => $first?->ten_hoc_phan,
                    'so_tin_chi' => (int) ($first?->hocPhan?->so_tin_chi ?? 0),
                    'da_dang_ky' => in_array($courseCode, $registeredCourseCodes, true),
                    'options' => $options->all(),
                ];
            })
            ->sortBy('ma_hoc_phan', SORT_NATURAL)
            ->values();

        return $this->jsonResponse([
            'data' => [
                'registration_period' => $requestedTerm ? $this->termOnlyPeriodPayload($requestedTerm) : $this->periodPayload($displayPeriod),
                'registration_open' => $period !== null && ! $requestedTerm,
                'student_class_id' => $student->lop_id,
                'student_academic_info' => $this->studentAcademicInfoPayload($student),
                'courses' => $courses->all(),
                'registrations' => $registrations->map(fn (DangKyHocPhan $item) => $this->registrationPayload($item))->values()->all(),
                'student_timetable' => $this->studentTimetablePayload($timetableTermId, $timetableRegistrations),
                'message' => $period ? null : "Thời gian đăng ký không hợp lệ\nSinh viên vui lòng xem thông báo của trường hoặc liên hệ với cán bộ quản lý.",
            ],
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $student = $this->currentStudent($request);
        $period = $this->activePeriod();

        if (! $period) {
            abort(response()->json(['message' => 'Đợt đăng ký học phần chưa mở hoặc đã kết thúc.'], 422, [], JSON_UNESCAPED_UNICODE));
        }

        $payload = $request->validate([
            'lop_hoc_phan_dang_ky_id' => ['required', 'integer', 'exists:lop_hoc_phan_dang_kys,id'],
        ]);

        return $this->registerOrChangeClass($student, $period, (int) $payload['lop_hoc_phan_dang_ky_id']);
    }

    public function confirm(Request $request, DangKyHocPhan $dangKyHocPhan): JsonResponse
    {
        $student = $this->currentStudent($request);
        $period = $this->activePeriod();

        if (! $period) {
            abort(response()->json(['message' => 'Đợt đăng ký học phần chưa mở hoặc đã kết thúc.'], 422, [], JSON_UNESCAPED_UNICODE));
        }

        if ($dangKyHocPhan->sinh_vien_id !== $student->id || $dangKyHocPhan->hoc_ky_id !== $period->hoc_ky_id) {
            abort(403, 'Không có quyền xác nhận đăng ký này.');
        }

        $this->assertNoScheduleConflict($student, $period->hoc_ky_id, $dangKyHocPhan->lop_hoc_phan_id, $dangKyHocPhan->id);

        $dangKyHocPhan->fill([
            'status' => 'registered',
            'registered_at' => now(),
        ])->save();

        return $this->jsonResponse([
            'message' => 'Đã xác nhận đăng ký học phần.',
            'data' => $this->registrationPayload($dangKyHocPhan->fresh(['lopHocPhanDangKy.lopHocPhan.hocPhan'])),
        ]);
    }

    public function changeClass(Request $request, DangKyHocPhan $dangKyHocPhan): JsonResponse
    {
        $student = $this->currentStudent($request);
        $period = $this->activePeriod();

        if (! $period) {
            abort(response()->json(['message' => 'Đợt đăng ký học phần chưa mở hoặc đã kết thúc.'], 422, [], JSON_UNESCAPED_UNICODE));
        }

        if ($dangKyHocPhan->sinh_vien_id !== $student->id || $dangKyHocPhan->hoc_ky_id !== $period->hoc_ky_id) {
            abort(403, 'Không có quyền đổi lớp học phần này.');
        }

        $payload = $request->validate([
            'lop_hoc_phan_dang_ky_id' => ['required', 'integer', 'exists:lop_hoc_phan_dang_kys,id'],
        ]);

        return $this->registerOrChangeClass($student, $period, (int) $payload['lop_hoc_phan_dang_ky_id'], $dangKyHocPhan);
    }

    public function studentClassTimetable(Request $request, LopHocPhanDangKy $lopHocPhanDangKy): JsonResponse
    {
        $this->currentStudent($request);

        $lopHocPhanDangKy->load('lopHocPhan.hocPhan', 'hocKy.namHoc');
        $weekConfig = CauHinhTuanHoc::query()->where('hoc_ky_id', $lopHocPhanDangKy->hoc_ky_id)->first();

        $timetable = ThoiKhoaBieu::query()
            ->with(['lopHocPhan.hocPhan', 'phongHoc'])
            ->where('hoc_ky_id', $lopHocPhanDangKy->hoc_ky_id)
            ->where('lop_hoc_phan_id', $lopHocPhanDangKy->lop_hoc_phan_id)
            ->orderBy('thu')
            ->orderBy('tiet_bat_dau')
            ->get()
            ->map(fn (ThoiKhoaBieu $schedule) => $this->timetablePayload($schedule, $weekConfig))
            ->values();

        return $this->jsonResponse([
            'data' => [
                'class' => $this->classPayload($lopHocPhanDangKy),
                'timetable' => $timetable->all(),
            ],
        ]);
    }

    public function cancel(Request $request, DangKyHocPhan $dangKyHocPhan): JsonResponse
    {
        $student = $this->currentStudent($request);
        $period = $this->activePeriod();

        if (! $period) {
            abort(response()->json(['message' => 'Đợt đăng ký học phần chưa mở hoặc đã kết thúc.'], 422, [], JSON_UNESCAPED_UNICODE));
        }

        if ($dangKyHocPhan->sinh_vien_id !== $student->id || $dangKyHocPhan->hoc_ky_id !== $period->hoc_ky_id) {
            abort(403, 'Không có quyền hủy đăng ký này.');
        }

        $dangKyHocPhan->delete();

        return $this->jsonResponse(['message' => 'Đã hủy đăng ký học phần.']);
    }

    public function classDetail(LopHocPhanDangKy $lopHocPhanDangKy): JsonResponse
    {
        $this->syncClassRegistrations($lopHocPhanDangKy->hoc_ky_id);

        $hasTimetable = ThoiKhoaBieu::query()
            ->where('hoc_ky_id', $lopHocPhanDangKy->hoc_ky_id)
            ->where('lop_hoc_phan_id', $lopHocPhanDangKy->lop_hoc_phan_id)
            ->exists();

        if (! $hasTimetable) {
            return $this->jsonResponse(['message' => 'Lớp học phần này không còn thời khóa biểu.'], 404);
        }

        $lopHocPhanDangKy->load('lopHocPhan.hocPhan');
        $weekConfig = CauHinhTuanHoc::query()->where('hoc_ky_id', $lopHocPhanDangKy->hoc_ky_id)->first();

        $timetable = ThoiKhoaBieu::query()
            ->with(['lopHocPhan.hocPhan', 'phongHoc'])
            ->where('hoc_ky_id', $lopHocPhanDangKy->hoc_ky_id)
            ->where('lop_hoc_phan_id', $lopHocPhanDangKy->lop_hoc_phan_id)
            ->orderBy('thu')
            ->orderBy('tiet_bat_dau')
            ->get()
            ->map(fn (ThoiKhoaBieu $schedule) => $this->timetablePayload($schedule, $weekConfig))
            ->values();

        $students = DangKyHocPhan::query()
            ->with('sinhVien.lop')
            ->where('lop_hoc_phan_dang_ky_id', $lopHocPhanDangKy->id)
            ->where('status', 'registered')
            ->orderBy('id')
            ->get()
            ->map(fn (DangKyHocPhan $item) => [
                'id' => $item->sinhVien?->id,
                'ma_sinh_vien' => $item->sinhVien?->user_id,
                'ho_ten' => $item->sinhVien?->ten_sinh_vien,
                'gioi_tinh' => $item->sinhVien?->gioi_tinh,
                'ma_lop' => $item->sinhVien?->ma_lop ?? $item->sinhVien?->lop?->lop_hoc_phan,
            ])
            ->values();

        return $this->jsonResponse([
            'data' => [
                'class' => $this->classPayload($lopHocPhanDangKy),
                'timetable' => $timetable->all(),
                'students' => $students->all(),
            ],
        ]);
    }

    private function registerOrChangeClass(SinhVien $student, HocPhanDangKyDotDangKy $period, int $classRegistrationId, ?DangKyHocPhan $existing = null): JsonResponse
    {
        $this->syncClassRegistrations($period->hoc_ky_id);

        $classRegistration = LopHocPhanDangKy::query()
            ->with('lopHocPhan.hocPhan')
            ->whereKey($classRegistrationId)
            ->where('hoc_ky_id', $period->hoc_ky_id)
            ->where('status', 'open')
            ->firstOrFail();
        $classSection = $classRegistration->lopHocPhan;

        if (! $classSection) {
            abort(response()->json(['message' => 'Lớp học phần không còn tồn tại.'], 422, [], JSON_UNESCAPED_UNICODE));
        }

        if (! in_array($classSection->ma_hoc_phan, $this->approvedStudyPlanCourseCodes($student, $period->hoc_ky_id), true)) {
            abort(response()->json(['message' => 'Học phần này không nằm trong kế hoạch học tập đã đăng ký của sinh viên.'], 422, [], JSON_UNESCAPED_UNICODE));
        }

        $registration = $existing ?? DangKyHocPhan::query()
            ->where('sinh_vien_id', $student->id)
            ->where('hoc_ky_id', $period->hoc_ky_id)
            ->where('ma_hoc_phan', $classSection->ma_hoc_phan)
            ->first();

        if ($registration && $registration->ma_hoc_phan !== $classSection->ma_hoc_phan) {
            abort(response()->json(['message' => 'Lớp học phần không cùng mã học phần.'], 422, [], JSON_UNESCAPED_UNICODE));
        }

        $currentCount = DangKyHocPhan::query()
            ->where('lop_hoc_phan_dang_ky_id', $classRegistration->id)
            ->where('status', 'registered')
            ->when($registration, fn ($query) => $query->whereKeyNot($registration->id))
            ->count();

        if ($currentCount >= $classRegistration->si_so_toi_da) {
            abort(response()->json(['message' => 'Lớp học phần đã hết chỉ tiêu đăng ký.'], 422, [], JSON_UNESCAPED_UNICODE));
        }

        $this->assertNoScheduleConflict($student, $period->hoc_ky_id, $classSection->id, $registration?->id);

        if (! $registration) {
            $registration = new DangKyHocPhan([
                'sinh_vien_id' => $student->id,
                'hoc_ky_id' => $period->hoc_ky_id,
                'ma_hoc_phan' => $classSection->ma_hoc_phan,
            ]);
        }

        $registration->fill([
            'lop_hoc_phan_dang_ky_id' => $classRegistration->id,
            'lop_hoc_phan_id' => $classSection->id,
            'status' => 'registered',
            'registered_at' => now(),
        ])->save();

        return $this->jsonResponse([
            'message' => 'Đã xác nhận đăng ký học phần.',
            'data' => $this->registrationPayload($registration->fresh(['lopHocPhanDangKy.lopHocPhan.hocPhan'])),
        ]);
    }

    private function syncClassRegistrations(int $termId): void
    {
        $classSectionIds = ThoiKhoaBieu::query()
            ->where('hoc_ky_id', $termId)
            ->whereNotNull('lop_hoc_phan_id')
            ->distinct()
            ->pluck('lop_hoc_phan_id');

        $staleClassRegistrations = LopHocPhanDangKy::query()
            ->where('hoc_ky_id', $termId);

        if ($classSectionIds->isEmpty()) {
            $staleClassRegistrations->delete();
        } else {
            $staleClassRegistrations
                ->whereNotIn('lop_hoc_phan_id', $classSectionIds->all())
                ->delete();
        }

        foreach ($classSectionIds as $classSectionId) {
            $classSection = LopHocPhan::query()->find($classSectionId);
            if (! $classSection) {
                continue;
            }

            LopHocPhanDangKy::query()->firstOrCreate([
                'hoc_ky_id' => $termId,
                'lop_hoc_phan_id' => $classSection->id,
            ], [
                'si_so_toi_da' => max(0, (int) $classSection->si_so),
                'status' => 'open',
            ]);
        }
    }

    private function latestTimetableTermId(): ?int
    {
        $currentTermId = $this->currentTermId();

        return $currentTermId > 0 ? $currentTermId : ThoiKhoaBieu::query()->latest('hoc_ky_id')->value('hoc_ky_id');
    }

    private function currentTermId(): int
    {
        $termId = (int) (HeThongCauHinh::query()->find('current_hoc_ky_id')?->value ?? 0);
        if ($termId <= 0) {
            $termId = (int) (HeThongCauHinh::query()->find('current_academic_term_id')?->value ?? 0);
        }

        return $termId;
    }

    private function periodForTerm(int $termId): ?HocPhanDangKyDotDangKy
    {
        if ($termId <= 0) {
            return null;
        }

        return HocPhanDangKyDotDangKy::query()
            ->with('hocKy.namHoc:id,nam_hoc')
            ->where('hoc_ky_id', $termId)
            ->latest('id')
            ->first();
    }

    private function registeredRegistrationsForTimetable(SinhVien $student, int $termId): Collection
    {
        if ($termId <= 0) {
            return new Collection();
        }

        $plannedCourseCodes = $this->approvedStudyPlanCourseCodes($student, $termId);

        return DangKyHocPhan::query()
            ->where('sinh_vien_id', $student->id)
            ->where('hoc_ky_id', $termId)
            ->where('status', 'registered')
            ->when(
                ! empty($plannedCourseCodes),
                fn ($query) => $query->whereIn('ma_hoc_phan', $plannedCourseCodes),
                fn ($query) => $query->whereRaw('1 = 0')
            )
            ->get();
    }

    private function ensurePendingDefaultRegistrations(SinhVien $student, int $termId): void
    {
        if (! $student->lop_id) {
            return;
        }

        $plannedCourseCodes = $this->approvedStudyPlanCourseCodes($student, $termId);
        if (empty($plannedCourseCodes)) {
            return;
        }

        $classes = LopHocPhanDangKy::query()
            ->with('lopHocPhan')
            ->where('hoc_ky_id', $termId)
            ->where('status', 'open')
            ->whereHas('lopHocPhan', fn ($query) => $query
                ->where('lop_hanh_chinh_id', $student->lop_id)
                ->whereIn('ma_hoc_phan', $plannedCourseCodes))
            ->get();

        foreach ($classes as $classRegistration) {
            $section = $classRegistration->lopHocPhan;
            if (! $section) {
                continue;
            }

            DangKyHocPhan::query()->firstOrCreate([
                'sinh_vien_id' => $student->id,
                'hoc_ky_id' => $termId,
                'ma_hoc_phan' => $section->ma_hoc_phan,
            ], [
                'lop_hoc_phan_dang_ky_id' => $classRegistration->id,
                'lop_hoc_phan_id' => $section->id,
                'status' => 'pending',
            ]);
        }
    }

    private function approvedStudyPlanCourseCodes(SinhVien $student, int $termId): array
    {
        if ($termId <= 0) {
            return [];
        }

        return DB::table('ke_hoach_hoc_tap_chi_tiets as ct')
            ->join('ke_hoach_hoc_taps as khht', 'khht.id', '=', 'ct.ke_hoach_hoc_tap_id')
            ->join('hoc_phans as hp', 'hp.id', '=', 'ct.hoc_phan_id')
            ->where('khht.sinh_vien_id', $student->id)
            ->whereIn('khht.status', ['submitted', 'locked'])
            ->when(
                Schema::hasColumn('ke_hoach_hoc_tap_chi_tiets', 'hoc_ky_id'),
                fn ($query) => $query->whereRaw('COALESCE(ct.hoc_ky_id, khht.hoc_ky_id) = ?', [$termId]),
                fn ($query) => $query->where('khht.hoc_ky_id', $termId)
            )
            ->pluck('hp.ma_hoc_phan')
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    private function activePeriod(): ?HocPhanDangKyDotDangKy
    {
        $now = now();
        $currentTermId = $this->currentTermId();

        return HocPhanDangKyDotDangKy::query()
            ->with('hocKy.namHoc:id,nam_hoc')
            ->when($currentTermId > 0, fn ($query) => $query->where('hoc_ky_id', $currentTermId))
            ->where('status', 'open')
            ->where('starts_at', '<=', $now)
            ->where('ends_at', '>=', $now)
            ->latest('id')
            ->first();
    }

    private function latestConfiguredPeriod(): ?HocPhanDangKyDotDangKy
    {
        return HocPhanDangKyDotDangKy::query()
            ->with('hocKy.namHoc:id,nam_hoc')
            ->latest('id')
            ->first();
    }

    private function currentStudent(Request $request): SinhVien
    {
        $user = $request->user();
        $user?->syncProfileFromRole();
        $student = $user?->profile instanceof SinhVien
            ? $user->profile
            : SinhVien::query()->where('user_id', $user?->username)->first();

        if (! $student) {
            abort(403, 'Không xác định được sinh viên.');
        }

        return $student;
    }

    private function assertNoScheduleConflict(SinhVien $student, int $termId, int $newClassSectionId, ?int $ignoreRegistrationId = null): void
    {
        $conflict = $this->scheduleConflictClass($student, $termId, $newClassSectionId, $ignoreRegistrationId);

        if (! $conflict) {
            return;
        }

        abort(response()->json([
            'message' => "Trùng thời khóa biểu với {$conflict?->ma_hoc_phan} - {$conflict?->ten_hoc_phan}.",
        ], 422, [], JSON_UNESCAPED_UNICODE));
    }

    private function hasScheduleConflict(SinhVien $student, int $termId, int $newClassSectionId, ?int $ignoreRegistrationId = null): bool
    {
        $newSchedules = ThoiKhoaBieu::query()
            ->where('hoc_ky_id', $termId)
            ->where('lop_hoc_phan_id', $newClassSectionId)
            ->get();

        $registeredClassIds = DangKyHocPhan::query()
            ->where('sinh_vien_id', $student->id)
            ->where('hoc_ky_id', $termId)
            ->where('status', 'registered')
            ->when($ignoreRegistrationId, fn ($query) => $query->whereKeyNot($ignoreRegistrationId))
            ->pluck('lop_hoc_phan_id');

        if ($registeredClassIds->isEmpty() || $newSchedules->isEmpty()) {
            return false;
        }

        $registeredSchedules = ThoiKhoaBieu::query()
            ->where('hoc_ky_id', $termId)
            ->whereIn('lop_hoc_phan_id', $registeredClassIds)
            ->get();

        foreach ($newSchedules as $newSchedule) {
            foreach ($registeredSchedules as $registeredSchedule) {
                $periodOverlap = $newSchedule->tiet_bat_dau <= $registeredSchedule->tiet_ket_thuc
                    && $newSchedule->tiet_ket_thuc >= $registeredSchedule->tiet_bat_dau;
                $weekOverlap = $newSchedule->tuan_bat_dau <= $registeredSchedule->tuan_ket_thuc
                    && $newSchedule->tuan_ket_thuc >= $registeredSchedule->tuan_bat_dau;

                if ($newSchedule->thu === $registeredSchedule->thu && $periodOverlap && $weekOverlap) {
                    return true;
                }
            }
        }

        return false;
    }

    private function scheduleConflictClass(SinhVien $student, int $termId, int $newClassSectionId, ?int $ignoreRegistrationId = null): ?LopHocPhan
    {
        $newSchedules = ThoiKhoaBieu::query()
            ->where('hoc_ky_id', $termId)
            ->where('lop_hoc_phan_id', $newClassSectionId)
            ->get();

        $registeredClassIds = DangKyHocPhan::query()
            ->where('sinh_vien_id', $student->id)
            ->where('hoc_ky_id', $termId)
            ->where('status', 'registered')
            ->when($ignoreRegistrationId, fn ($query) => $query->whereKeyNot($ignoreRegistrationId))
            ->pluck('lop_hoc_phan_id');

        if ($registeredClassIds->isEmpty() || $newSchedules->isEmpty()) {
            return null;
        }

        $registeredSchedules = ThoiKhoaBieu::query()
            ->with('lopHocPhan:id,ma_hoc_phan,ten_hoc_phan,nhom_hoc_phan')
            ->where('hoc_ky_id', $termId)
            ->whereIn('lop_hoc_phan_id', $registeredClassIds)
            ->get();

        foreach ($newSchedules as $newSchedule) {
            foreach ($registeredSchedules as $registeredSchedule) {
                $periodOverlap = $newSchedule->tiet_bat_dau <= $registeredSchedule->tiet_ket_thuc
                    && $newSchedule->tiet_ket_thuc >= $registeredSchedule->tiet_bat_dau;
                $weekOverlap = $newSchedule->tuan_bat_dau <= $registeredSchedule->tuan_ket_thuc
                    && $newSchedule->tuan_ket_thuc >= $registeredSchedule->tuan_bat_dau;

                if ($newSchedule->thu === $registeredSchedule->thu && $periodOverlap && $weekOverlap) {
                    abort(response()->json([
                        'message' => "Trùng thời khóa biểu với {$registeredSchedule->lopHocPhan?->ma_hoc_phan} - {$registeredSchedule->lopHocPhan?->ten_hoc_phan}.",
                    ], 422, [], JSON_UNESCAPED_UNICODE));
                }
            }
        }

        return null;
    }

    private function periodPayload(HocPhanDangKyDotDangKy $period): array
    {
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

    private function termOnlyPeriodPayload(HocKy $term): array
    {
        $term->loadMissing('namHoc:id,nam_hoc');

        return [
            'id' => null,
            'hoc_ky_id' => $term->id,
            'starts_at' => null,
            'ends_at' => null,
            'status' => 'closed',
            'term' => [
                'hoc_ky' => $term->hoc_ky,
                'nam_hoc' => $term->namHoc?->nam_hoc,
            ],
        ];
    }

    private function classPayload(LopHocPhanDangKy $item): array
    {
        $section = $item->lopHocPhan;

        return [
            'id' => $item->id,
            'hoc_ky_id' => $item->hoc_ky_id,
            'lop_hoc_phan_id' => $item->lop_hoc_phan_id,
            'ma_hoc_phan' => $section?->ma_hoc_phan,
            'ten_hoc_phan' => $section?->ten_hoc_phan,
            'so_tin_chi' => (int) ($section?->hocPhan?->so_tin_chi ?? 0),
            'lop_hoc_phan' => $section?->lop_hoc_phan,
            'nhom_hoc_phan' => $section?->nhom_hoc_phan,
            'ten_giang_vien' => $section?->ten_giang_vien,
            'si_so_toi_da' => $item->si_so_toi_da,
            'so_sv_da_dk' => (int) ($item->so_sv_da_dk ?? 0),
            'status' => $item->status,
            'term' => $item->hocKy ? [
                'hoc_ky' => $item->hocKy->hoc_ky,
                'nam_hoc' => $item->hocKy->namHoc?->nam_hoc,
            ] : null,
        ];
    }

    private function studentAcademicInfoPayload(SinhVien $student): array
    {
        $student->loadMissing('lop:id,lop_hoc_phan');
        $majorName = trim((string) ($student->ten_nganh_hoc ?? ''));

        if ($majorName === '' && $student->nganh_dao_tao_id) {
            $majorName = (string) (NganhDaoTao::query()
                ->whereKey($student->nganh_dao_tao_id)
                ->value('ten_nganh') ?? '');
        }

        return [
            'ma_lop' => $student->lop?->lop_hoc_phan ?: $student->ma_lop,
            'ten_nganh_hoc' => $majorName,
        ];
    }

    private function studentClassOptionPayload(LopHocPhanDangKy $item, SinhVien $student, int $termId, ?int $ignoreRegistrationId = null): array
    {
        $section = $item->lopHocPhan;

        return [
            ...$this->classPayload($item),
            'is_default' => $section?->lop_hanh_chinh_id !== null
                && $student->lop_id !== null
                && (int) $section->lop_hanh_chinh_id === (int) $student->lop_id,
            'is_full' => (int) ($item->so_sv_da_dk ?? 0) >= $item->si_so_toi_da,
            'has_conflict' => $section
                ? $this->hasScheduleConflict($student, $termId, $section->id, $ignoreRegistrationId)
                : false,
        ];
    }

    private function registrationPayload(DangKyHocPhan $item): array
    {
        $section = $item->lopHocPhanDangKy?->lopHocPhan ?? $item->lopHocPhan;

        return [
            'id' => $item->id,
            'hoc_ky_id' => $item->hoc_ky_id,
            'lop_hoc_phan_dang_ky_id' => $item->lop_hoc_phan_dang_ky_id,
            'lop_hoc_phan_id' => $item->lop_hoc_phan_id,
            'ma_hoc_phan' => $item->ma_hoc_phan,
            'ten_hoc_phan' => $section?->ten_hoc_phan,
            'so_tin_chi' => (int) ($section?->hocPhan?->so_tin_chi ?? 0),
            'lop_hoc_phan' => $section?->lop_hoc_phan,
            'nhom_hoc_phan' => $section?->nhom_hoc_phan,
            'ten_giang_vien' => $section?->ten_giang_vien,
            'status' => $item->status,
            'registered_at' => $item->registered_at?->toISOString(),
        ];
    }

    /**
     * @param Collection<int, DangKyHocPhan> $registrations
     */
    private function studentTimetablePayload(int $termId, Collection $registrations): array
    {
        $classSectionIds = $registrations->pluck('lop_hoc_phan_id')->filter()->unique()->values();

        if ($classSectionIds->isEmpty()) {
            return [];
        }

        $weekConfig = CauHinhTuanHoc::query()->where('hoc_ky_id', $termId)->first();

        return ThoiKhoaBieu::query()
            ->with(['lopHocPhan.hocPhan', 'phongHoc'])
            ->where('hoc_ky_id', $termId)
            ->whereIn('lop_hoc_phan_id', $classSectionIds)
            ->orderBy('thu')
            ->orderBy('tiet_bat_dau')
            ->get()
            ->map(fn (ThoiKhoaBieu $schedule) => $this->timetablePayload($schedule, $weekConfig))
            ->values()
            ->all();
    }

    private function timetablePayload(ThoiKhoaBieu $schedule, ?CauHinhTuanHoc $weekConfig): array
    {
        $section = $schedule->lopHocPhan;
        $startDate = $weekConfig?->tuan_1_bat_dau
            ? $weekConfig->tuan_1_bat_dau->copy()->addWeeks(max(0, $schedule->tuan_bat_dau - 1))->toDateString()
            : null;

        return [
            'id' => $schedule->id,
            'ma_hoc_phan' => $section?->ma_hoc_phan ?? $schedule->ma_hoc_phan_snapshot,
            'nhom_hoc_phan' => $section?->nhom_hoc_phan ?? $schedule->nhom_hoc_phan_snapshot,
            'ten_hoc_phan' => $section?->ten_hoc_phan ?? $schedule->ten_hoc_phan_snapshot,
            'so_tin_chi' => (int) ($section?->hocPhan?->so_tin_chi ?? 0),
            'lop_hoc_phan' => $section?->lop_hoc_phan ?? $schedule->lop_hoc_phan_snapshot,
            'thu' => $schedule->thu,
            'tiet_bat_dau' => $schedule->tiet_bat_dau,
            'tiet_ket_thuc' => $schedule->tiet_ket_thuc,
            'tuan_bat_dau' => $schedule->tuan_bat_dau,
            'tuan_ket_thuc' => $schedule->tuan_ket_thuc,
            'ten_giang_vien' => $section?->ten_giang_vien ?? $schedule->ten_giang_vien_snapshot,
            'ten_phong' => $schedule->phongHoc?->ma_phong ?? $schedule->ma_phong_snapshot,
            'ngay_bat_dau_hoc' => $startDate,
        ];
    }
}


