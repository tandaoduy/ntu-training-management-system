<?php

namespace App\Http\Controllers\Api;

use App\Models\HocKy;
use App\Models\HeThongCauHinh;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentDashboardController extends Controller
{
    private const STUDENT_PROFILE_EDIT_WINDOW_KEY = 'student_profile_edit_window';

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

        $studentPayload = $user?->student?->toArray();
        if ($studentPayload && ! empty($studentPayload['anh'])) {
            $studentPayload['anh_url'] = '/api/student-images/' . ltrim((string) $studentPayload['anh'], '/');
        }

        return $this->jsonResponse([
            'message' => 'Student dashboard data',
            'status' => $user?->student ? 'ok' : 'missing_student_profile',
            'student' => $studentPayload,
            'profile_edit_window' => $this->profileEditWindowPayload(),
            'permissions' => $user?->permissionCodes()->values() ?? [],
            'hoc_ky_hien_hanh' => $hocKyPayload,
            'hoc_ky_hien_hanh_configured' => $hocKyPayload !== null,
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user()?->loadMissing('student');
        $student = $user?->student;

        if (! $student) {
            return $this->jsonResponse(['message' => 'Không xác định được hồ sơ sinh viên.'], 404);
        }

        if (! $this->profileEditWindowPayload()['is_open']) {
            return $this->jsonResponse(['message' => 'Hiện không trong thời gian sinh viên được chỉnh sửa thông tin.'], 422);
        }

        $payload = $request->validate([
            'ngay_sinh' => ['nullable', 'date_format:Y-m-d'],
            'noi_sinh' => ['nullable', 'string', 'max:255'],
            'gioi_tinh' => ['nullable', 'string', 'max:20'],
            'dan_toc' => ['nullable', 'string', 'max:100'],
            'ton_giao' => ['nullable', 'string', 'max:100'],
            'ho_khau_tinh_thanh_pho' => ['nullable', 'string', 'max:255'],
            'ho_khau_quan_huyen' => ['nullable', 'string', 'max:255'],
            'que_quan_tinh_thanh_pho' => ['nullable', 'string', 'max:255'],
            'que_quan_quan_huyen' => ['nullable', 'string', 'max:255'],
            'dia_chi_lien_lac' => ['nullable', 'string', 'max:255'],
            'so_dien_thoai' => ['nullable', 'string', 'regex:/^\d{10}$/'],
            'so_dien_thoai_gia_dinh' => ['nullable', 'string', 'regex:/^\d{10}$/'],
            'ho_ten_cha' => ['nullable', 'string', 'max:255'],
            'ngay_sinh_cha' => ['nullable', 'date_format:Y-m-d'],
            'que_quan_cha' => ['nullable', 'string', 'max:255'],
            'nghe_nghiep_cha' => ['nullable', 'string', 'max:255'],
            'ho_ten_me' => ['nullable', 'string', 'max:255'],
            'ngay_sinh_me' => ['nullable', 'date_format:Y-m-d'],
            'que_quan_me' => ['nullable', 'string', 'max:255'],
            'nghe_nghiep_me' => ['nullable', 'string', 'max:255'],
        ]);

        $student->fill($payload)->save();

        $studentPayload = $student->fresh()->toArray();
        if (! empty($studentPayload['anh'])) {
            $studentPayload['anh_url'] = '/api/student-images/' . ltrim((string) $studentPayload['anh'], '/');
        }

        return $this->jsonResponse([
            'message' => 'Đã cập nhật thông tin liên hệ.',
            'student' => $studentPayload,
            'profile_edit_window' => $this->profileEditWindowPayload(),
        ]);
    }

    private function profileEditWindowPayload(): array
    {
        $value = HeThongCauHinh::query()->find(self::STUDENT_PROFILE_EDIT_WINDOW_KEY)?->value;
        $config = json_decode((string) $value, true);
        $config = is_array($config) ? $config : [];
        $startsAt = $config['starts_at'] ?? null;
        $endsAt = $config['ends_at'] ?? null;
        $enabled = (bool) ($config['enabled'] ?? false);
        $isOpen = false;

        if ($enabled && $startsAt && $endsAt) {
            $now = now();
            $isOpen = $now->greaterThanOrEqualTo(\Carbon\Carbon::parse($startsAt))
                && $now->lessThanOrEqualTo(\Carbon\Carbon::parse($endsAt));
        }

        return [
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'enabled' => $enabled,
            'is_open' => $isOpen,
        ];
    }
}
