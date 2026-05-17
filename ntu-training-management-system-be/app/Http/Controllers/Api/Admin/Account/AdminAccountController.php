<?php

namespace App\Http\Controllers\Api\Admin\Account;

use App\Http\Controllers\Controller;
use App\Models\CanBo;
use App\Models\ChuyenVien;
use App\Models\DanToc;
use App\Models\DonVi;
use App\Models\Lop;
use App\Models\NganhDaoTao;
use App\Models\QuanLy;
use App\Models\SinhVien;
use App\Models\TonGiao;
use App\Models\User;
use App\Services\Admin\AccountProvisioningService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class AdminAccountController extends Controller
{
    public function __construct(
        private readonly AccountProvisioningService $accountProvisioningService,
    ) {
    }

    private function jsonResponse(array $payload, int $status = 200): JsonResponse
    {
        return response()->json($payload, $status, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    public function index(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'role' => ['sometimes', Rule::in(['student', 'lecturer', 'manager', 'training_officer', 'admin'])],
            'q' => ['sometimes', 'string', 'max:100'],
        ]);

        $accounts = User::query()
            ->with(['role:id,code,name', 'profile'])
            ->when(isset($payload['role']), fn ($query) => $query
                ->whereHas('role', fn ($roleQuery) => $roleQuery->where('code', $payload['role'])))
            ->when(isset($payload['q']), function ($query) use ($payload): void {
                $keyword = trim((string) $payload['q']);

                if ($keyword !== '') {
                    $query->where('username', 'like', "%{$keyword}%");
                }
            })
            ->orderByDesc('id')
            ->get()
            ->map(fn (User $user) => $this->toAccountPayload($user))
            ->values();

        return $this->jsonResponse([
            'data' => $accounts,
        ]);
    }

    public function studentCatalog(): JsonResponse
    {
        $lopsByDonViId = Lop::query()
            ->select(['id', 'don_vi_id', 'lop_hoc_phan', 'si_so', 'mo_hinh_dao_tao', 'ma_khoi', 'ten_khoi', 'ma_don_vi', 'ten_don_vi'])
            ->where('trang_thai', true)
            ->orderBy('ma_khoi')
            ->get()
            ->groupBy('don_vi_id');

        $nganhDaoTaosByDonViId = NganhDaoTao::query()
            ->select(['id', 'ma_nganh', 'ten_nganh', 'don_vi_id', 'he_dao_tao', 'thoi_gian_dao_tao'])
            ->orderBy('ma_nganh')
            ->get()
            ->groupBy('don_vi_id');

        $donVis = DonVi::query()
            ->select(['id', 'ma_don_vi', 'ten_don_vi', 'loai_don_vi'])
            ->orderBy('ma_don_vi')
            ->get()
            ->map(fn (DonVi $donVi): array => [
                'id' => $donVi->id,
                'ma_don_vi' => $donVi->ma_don_vi,
                'ten_don_vi' => $donVi->ten_don_vi,
                'loai_don_vi' => $donVi->loai_don_vi,
                'lops' => $lopsByDonViId->get($donVi->id, collect())->values(),
                'nganh_dao_taos' => $nganhDaoTaosByDonViId->get($donVi->id, collect())->values(),
            ])
            ->values();

        $danTocs = DanToc::query()
            ->select(['id', 'ten_dan_toc', 'thu_tu'])
            ->orderBy('thu_tu')
            ->get();

        $tonGiaos = TonGiao::query()
            ->select(['id', 'ten_ton_giao', 'thu_tu'])
            ->orderBy('thu_tu')
            ->get();

        return $this->jsonResponse([
            'data' => [
                'don_vis' => $donVis,
                'dan_tocs' => $danTocs,
                'ton_giaos' => $tonGiaos,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'role' => ['required', Rule::in(['student', 'lecturer', 'manager', 'training_officer'])],
            'username' => [
                'required',
                'string',
                'max:50',
                Rule::unique('users', 'username'),
                function (string $attribute, mixed $value, \Closure $fail) use ($request): void {
                    if ($request->input('role') === 'student' && ! preg_match('/^\d{8}$/', (string) $value)) {
                        $fail('MSSV phải gồm đúng 8 chữ số.');
                    }

                    if ($request->input('role') === 'lecturer' && ! preg_match('/^\d{7}$/', (string) $value)) {
                        $fail('Mã giảng viên phải gồm đúng 7 chữ số.');
                    }
                },
            ],
            'password' => ['sometimes', 'string', 'min:6'],
            'name' => [
                'required',
                'string',
                'max:255',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (! preg_match('/^[\p{L}\s]+$/u', trim((string) $value))) {
                        $fail('Họ và tên chỉ được gồm chữ cái và khoảng trắng.');
                    }
                },
            ],
            'email' => [
                'nullable',
                'email',
                'max:255',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ($this->isProfileEmailTaken($value)) {
                        $fail('Email này đã được sử dụng ở một tài khoản khác.');
                    }
                },
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ($value && ! str_ends_with(mb_strtolower((string) $value, 'UTF-8'), '@ntu.edu.vn')) {
                        $fail('Email liên hệ phải thuộc tên miền @ntu.edu.vn.');
                    }
                },
            ],
            'phone' => ['nullable', 'string', 'regex:/^\d{10}$/'],
            'status' => ['sometimes', 'boolean'],
            'gioi_tinh' => ['nullable', 'string', 'max:20'],
            'ngay_sinh' => ['nullable', 'date_format:Y-m-d', 'regex:/^\d{4}-\d{2}-\d{2}$/'],
            'noi_sinh' => ['nullable', 'string', 'max:255'],
            'ma_lop' => ['nullable', 'string', 'max:100'],
            'lop_id' => ['nullable', 'integer', 'exists:lops,id'],
            'don_vi_id' => ['required_if:role,lecturer', 'nullable', 'integer', 'exists:don_vis,id'],
            'nganh_dao_tao_id' => [
                'nullable',
                'integer',
                Rule::exists('nganh_dao_taos', 'id')
                    ->where(fn ($query) => $query->where('don_vi_id', $request->input('don_vi_id'))),
            ],
            'ten_don_vi' => ['nullable', 'string', 'max:255'],
            'ten_nganh_hoc' => ['nullable', 'string', 'max:255'],
            'he_dao_tao' => ['nullable', Rule::in(['Đại học Chính quy', 'Vừa học vừa làm', 'Đào tạo từ xa'])],
            'nam_nhap_hoc' => ['required_if:role,student', 'integer', 'min:2023', 'max:2100'],
            'khoa_hoc' => ['nullable', 'string', 'regex:/^\d{4}-\d{4}$/'],
            'so_cccd' => ['required_if:role,student', 'string', 'regex:/^\d{12}$/'],
            'ngay_cap_cccd' => ['nullable', 'date_format:Y-m-d', 'regex:/^\d{4}-\d{2}-\d{2}$/'],
            'noi_cap_cccd' => ['nullable', 'string', 'max:255'],
            'ho_khau_tinh_thanh_pho' => ['nullable', 'string', 'max:255'],
            'ho_khau_quan_huyen' => ['nullable', 'string', 'max:255'],
            'que_quan_tinh_thanh_pho' => ['nullable', 'string', 'max:255'],
            'que_quan_quan_huyen' => ['nullable', 'string', 'max:255'],
            'que_quan' => ['nullable', 'string', 'max:255'],
            'dia_chi_lien_lac' => ['nullable', 'string'],
            'dan_toc' => ['nullable', 'string', 'max:100'],
            'ton_giao' => ['nullable', 'string', 'max:100'],
        ]);

        $payload['name'] = $this->normalizePersonName($payload['name']);
        $this->fillStudentCohort($payload);

        $user = match ($payload['role']) {
            'student' => $this->accountProvisioningService->createStudentAccount($payload),
            'lecturer' => $this->accountProvisioningService->createLecturerAccount($payload),
            'manager' => $this->accountProvisioningService->createManagerAccount($payload),
            'training_officer' => $this->accountProvisioningService->createTrainingOfficerAccount($payload),
        };

        return $this->jsonResponse([
            'message' => 'Đã tạo tài khoản thành công',
            'data' => $this->toAccountPayload($user),
        ], 201);
    }

    public function storeStudent(Request $request): JsonResponse
    {
        $payload = $request->validate($this->studentRules($request));
        $payload['ten_sinh_vien'] = $this->normalizePersonName($payload['ten_sinh_vien']);
        $this->fillStudentCohort($payload);
        $user = $this->accountProvisioningService->createStudentAccount($payload);

        // Handle image upload if provided
        if ($request->hasFile('anh')) {
            try {
                $file = $request->file('anh');
                $fileName = 'students/' . $user->id . '/' . time() . '_' . $file->getClientOriginalName();
                $path = Storage::disk('public')->putFileAs('', $file, $fileName);
                
                $user->profile->update(['anh' => $path]);
            } catch (\Exception $e) {
                // Log error but don't fail the account creation
                Log::error('Failed to upload student image: ' . $e->getMessage());
            }
        }

        return $this->createdResponse($user);
    }

    public function storeLecturer(Request $request): JsonResponse
    {
        $payload = $request->validate($this->lecturerRules());
        $payload['ten_giang_vien'] = $this->normalizePersonName($payload['ten_giang_vien']);
        $user = $this->accountProvisioningService->createLecturerAccount($payload);

        return $this->createdResponse($user);
    }

    public function storeManager(Request $request): JsonResponse
    {
        $payload = $request->validate($this->managerRules());
        $user = $this->accountProvisioningService->createManagerAccount($payload);

        return $this->createdResponse($user);
    }

    public function storeTrainingOfficer(Request $request): JsonResponse
    {
        $payload = $request->validate($this->trainingOfficerRules());
        $user = $this->accountProvisioningService->createTrainingOfficerAccount($payload);

        return $this->createdResponse($user);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $payload = $request->validate([
            'password' => ['sometimes', 'string', 'min:6'],
            'status' => ['sometimes', 'boolean'],
            'profile' => ['sometimes', 'array'],
            'profile.ten_sinh_vien' => ['nullable', 'string', 'max:255'],
            'profile.ten_giang_vien' => ['nullable', 'string', 'max:255'],
            'profile.ten_nguoi_quan_ly' => ['nullable', 'string', 'max:255'],
            'profile.ten_chuyen_vien' => ['nullable', 'string', 'max:255'],
            'profile.email' => [
                'nullable',
                'email',
                'max:255',
                function (string $attribute, mixed $value, \Closure $fail) use ($user): void {
                    if ($this->isProfileEmailTaken($value, $user)) {
                        $fail('Email này đã được sử dụng ở một tài khoản khác.');
                    }
                },
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ($value && ! str_ends_with(mb_strtolower((string) $value, 'UTF-8'), '@ntu.edu.vn')) {
                        $fail('Email liên hệ phải thuộc tên miền @ntu.edu.vn.');
                    }
                },
            ],
            'profile.so_dien_thoai' => ['nullable', 'string', 'regex:/^\d{10}$/'],
            'profile.phone' => ['nullable', 'string', 'regex:/^\d{10}$/'],
            'profile.ngay_sinh' => ['nullable', 'date_format:Y-m-d', 'regex:/^\d{4}-\d{2}-\d{2}$/'],
            'profile.noi_sinh' => ['nullable', 'string', 'max:255'],
            'profile.gioi_tinh' => ['nullable', 'string', 'max:20'],
            'profile.que_quan' => ['nullable', 'string', 'max:255'],
            'profile.don_vi_id' => ['nullable', 'integer', 'exists:don_vis,id'],
            'profile.ten_don_vi' => ['nullable', 'string', 'max:255'],
            'profile.ten_nganh_hoc' => ['nullable', 'string', 'max:255'],
            'profile.nganh_dao_tao_id' => ['nullable', 'integer', 'exists:nganh_dao_taos,id'],
            'profile.chuc_vu' => ['nullable', 'string', 'max:255'],
            'profile.chuc_danh' => ['nullable', 'string', 'max:255'],
            'profile.ma_lop' => ['nullable', 'string', 'max:100'],
            'profile.lop_id' => ['nullable', 'integer', 'exists:lops,id'],
            'profile.he_dao_tao' => ['nullable', Rule::in(['Đại học Chính quy', 'Vừa học vừa làm', 'Đào tạo từ xa'])],
            'profile.nam_nhap_hoc' => ['nullable', 'integer', 'min:2023', 'max:2100'],
            'profile.khoa_hoc' => ['nullable', 'string', 'regex:/^\d{4}-\d{4}$/'],
            'profile.so_cccd' => ['nullable', 'string', 'regex:/^\d{12}$/'],
            'profile.ngay_cap_cccd' => ['nullable', 'date_format:Y-m-d', 'regex:/^\d{4}-\d{2}-\d{2}$/'],
            'profile.noi_cap_cccd' => ['nullable', 'string', 'max:255'],
            'profile.ho_khau_tinh_thanh_pho' => ['nullable', 'string', 'max:255'],
            'profile.ho_khau_quan_huyen' => ['nullable', 'string', 'max:255'],
            'profile.que_quan_tinh_thanh_pho' => ['nullable', 'string', 'max:255'],
            'profile.que_quan_quan_huyen' => ['nullable', 'string', 'max:255'],
            'profile.dan_toc' => ['nullable', 'string', 'max:100'],
            'profile.ton_giao' => ['nullable', 'string', 'max:100'],
            'anh' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif', 'max:5120'],
        ]);

        if (isset($payload['profile']['nam_nhap_hoc'])) {
            $trainingDuration = $this->getTrainingDuration(
                $payload['profile']['nganh_dao_tao_id'] ?? $user->profile?->nganh_dao_tao_id ?? null,
            );
            $payload['profile']['khoa_hoc'] = $this->academicCohort((int) $payload['profile']['nam_nhap_hoc'], $trainingDuration);
        }

        if (isset($payload['profile']['phone']) && ! isset($payload['profile']['so_dien_thoai'])) {
            $payload['profile']['so_dien_thoai'] = $payload['profile']['phone'];
            unset($payload['profile']['phone']);
        }

        // Handle image upload if provided
        if ($request->hasFile('anh')) {
            try {
                $file = $request->file('anh');
                $fileName = 'students/' . $user->id . '/' . time() . '_' . $file->getClientOriginalName();
                $path = Storage::disk('public')->putFileAs('', $file, $fileName);
                
                // Delete old image if exists
                if ($user->profile && isset($user->profile->anh) && !empty($user->profile->anh)) {
                    Storage::disk('public')->delete($user->profile->anh);
                }
                
                $payload['profile']['anh'] = $path;
            } catch (\Exception $e) {
                Log::error('Failed to upload student image: ' . $e->getMessage());
            }
        }

        $updatedUser = $this->accountProvisioningService->updateAccount($user, $payload);

        return $this->jsonResponse([
            'message' => 'Đã cập nhật tài khoản thành công',
            'data' => $this->toAccountPayload($updatedUser),
        ]);
    }

    public function resetPassword(Request $request, User $user): JsonResponse
    {
        $payload = $request->validate([
            'password' => ['sometimes', 'string', 'min:6'],
        ]);

        $updatedUser = $this->accountProvisioningService->resetPassword(
            $user,
            $payload['password'] ?? null,
        );

        return $this->jsonResponse([
            'message' => 'Đã đặt lại mật khẩu tài khoản',
            'data' => $this->toAccountPayload($updatedUser),
        ]);
    }

    public function lock(User $user): JsonResponse
    {
        $updatedUser = $this->accountProvisioningService->setAccountStatus($user, false);

        return $this->jsonResponse([
            'message' => 'Đã khóa tài khoản',
            'data' => $this->toAccountPayload($updatedUser),
        ]);
    }

    public function unlock(User $user): JsonResponse
    {
        $updatedUser = $this->accountProvisioningService->setAccountStatus($user, true);

        return $this->jsonResponse([
            'message' => 'Đã mở khóa tài khoản',
            'data' => $this->toAccountPayload($updatedUser),
        ]);
    }

    public function destroy(User $user): JsonResponse
    {
        $user->loadMissing('role');

        if (! in_array($user->role?->code, ['lecturer', 'training_officer', 'manager'], true)) {
            return $this->jsonResponse([
                'message' => 'Chỉ được xóa tài khoản giảng viên, chuyên viên hoặc quản lý.',
            ], 422);
        }

        $this->accountProvisioningService->deleteAccount($user);

        return $this->jsonResponse([
            'message' => 'Đã xóa tài khoản thành công',
        ]);
    }

    /**
     * Upload student image
     * POST /api/admin/accounts/{id}/upload-image
     */
    public function uploadStudentImage(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'anh' => ['required', 'image', 'mimes:jpeg,png,jpg,gif', 'max:5120'], // 5MB
        ]);

        if (!$request->hasFile('anh')) {
            return $this->jsonResponse([
                'message' => 'Không tìm thấy file ảnh',
                'error' => 'FILE_NOT_FOUND',
            ], 422);
        }

        try {
            $file = $request->file('anh');
            $fileName = 'students/' . $user->id . '/' . time() . '_' . $file->getClientOriginalName();
            
            // Store image in public disk
            $path = Storage::disk('public')->putFileAs('', $file, $fileName);
            
            // Delete old image if exists
            if ($user->profile && isset($user->profile->anh) && !empty($user->profile->anh)) {
                Storage::disk('public')->delete($user->profile->anh);
            }

            // Update profile with new image path
            $user->profile->update(['anh' => $path]);

            return $this->jsonResponse([
                'message' => 'Đã lưu ảnh sinh viên thành công',
                'data' => [
                    'id' => $user->id,
                    'anh' => $path,
                    'anh_url' => Storage::url($path),
                ],
            ]);
        } catch (\Exception $e) {
            return $this->jsonResponse([
                'message' => 'Lỗi khi lưu ảnh: ' . $e->getMessage(),
                'error' => 'UPLOAD_ERROR',
            ], 500);
        }
    }

    private function createdResponse(User $user): JsonResponse
    {
        return $this->jsonResponse([
            'message' => 'Đã tạo tài khoản thành công',
            'data' => $this->toAccountPayload($user),
        ], 201);
    }

    private function isProfileEmailTaken(mixed $email, ?User $exceptUser = null): bool
    {
        $normalizedEmail = mb_strtolower(trim((string) ($email ?? '')), 'UTF-8');

        if ($normalizedEmail === '') {
            return false;
        }

        $exceptProfileType = $exceptUser?->profile_type;
        $exceptProfileId = $exceptUser?->profile_id;

        foreach ([SinhVien::class, CanBo::class, ChuyenVien::class, QuanLy::class] as $modelClass) {
            $query = $modelClass::query()->whereRaw('LOWER(email) = ?', [$normalizedEmail]);

            if ($exceptProfileType === $modelClass && $exceptProfileId) {
                $query->whereKeyNot($exceptProfileId);
            }

            if ($query->exists()) {
                return true;
            }
        }

        return false;
    }

    private function baseCreateRules(): array
    {
        return [
            'username' => ['required', 'string', 'max:50', Rule::unique('users', 'username')],
            'password' => ['sometimes', 'string', 'min:6'],
            'email' => [
                'nullable',
                'email',
                'max:255',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ($this->isProfileEmailTaken($value)) {
                        $fail('Email này đã được sử dụng ở một tài khoản khác.');
                    }
                },
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ($value && ! str_ends_with(mb_strtolower((string) $value, 'UTF-8'), '@ntu.edu.vn')) {
                        $fail('Email liên hệ phải thuộc tên miền @ntu.edu.vn.');
                    }
                },
            ],
            'so_dien_thoai' => ['nullable', 'string', 'regex:/^\d{10}$/'],
            'phone' => ['nullable', 'string', 'regex:/^\d{10}$/'],
            'ngay_sinh' => ['nullable', 'date_format:Y-m-d', 'regex:/^\d{4}-\d{2}-\d{2}$/'],
            'gioi_tinh' => ['nullable', 'string', 'max:20'],
            'que_quan' => ['nullable', 'string', 'max:255'],
            'dan_toc' => ['nullable', 'string', 'max:100'],
            'ton_giao' => ['nullable', 'string', 'max:100'],
            'don_vi_id' => ['nullable', 'integer', 'exists:don_vis,id'],
            'status' => ['sometimes', 'boolean'],
        ];
    }

    private function studentRules(Request $request): array
    {
        return [
            ...$this->baseCreateRules(),
            'username' => ['required', 'string', 'regex:/^\d{8}$/', Rule::unique('users', 'username')],
            'ten_sinh_vien' => [
                'required',
                'string',
                'max:255',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (! preg_match('/^[\p{L}\s]+$/u', trim((string) $value))) {
                        $fail('Họ và tên chỉ được gồm chữ cái và khoảng trắng.');
                    }
                },
            ],
            'ma_lop' => ['nullable', 'string', 'max:100'],
            'lop_id' => ['nullable', 'integer', 'exists:lops,id'],
            'nganh_dao_tao_id' => [
                'nullable',
                'integer',
                Rule::exists('nganh_dao_taos', 'id')
                    ->where(fn ($query) => $query->where('don_vi_id', $request->input('don_vi_id'))),
            ],
            'ten_nganh_hoc' => ['nullable', 'string', 'max:255'],
            'ten_don_vi' => ['nullable', 'string', 'max:255'],
            'he_dao_tao' => ['nullable', Rule::in(['Đại học Chính quy', 'Vừa học vừa làm', 'Đào tạo từ xa'])],
            'noi_sinh' => ['nullable', 'string', 'max:255'],
            'nam_nhap_hoc' => ['required', 'integer', 'min:2023', 'max:2100'],
            'khoa_hoc' => ['nullable', 'string', 'regex:/^\d{4}-\d{4}$/'],
            'so_cccd' => ['required', 'string', 'regex:/^\d{12}$/'],
            'ngay_cap_cccd' => ['nullable', 'date_format:Y-m-d', 'regex:/^\d{4}-\d{2}-\d{2}$/'],
            'noi_cap_cccd' => ['nullable', 'string', 'max:255'],
            'ho_khau_tinh_thanh_pho' => ['nullable', 'string', 'max:255'],
            'ho_khau_quan_huyen' => ['nullable', 'string', 'max:255'],
            'que_quan_tinh_thanh_pho' => ['nullable', 'string', 'max:255'],
            'que_quan_quan_huyen' => ['nullable', 'string', 'max:255'],
            'dia_chi_lien_lac' => ['nullable', 'string'],
            'anh' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif', 'max:5120'], // 5MB max
        ];
    }

    private function normalizePersonName(string $name): string
    {
        $normalized = preg_replace('/\s+/u', ' ', trim($name)) ?? '';
        $normalized = mb_strtolower($normalized, 'UTF-8');

        return mb_convert_case($normalized, MB_CASE_TITLE, 'UTF-8');
    }

    private function academicCohort(int $admissionYear, float $trainingDuration = 4.0): string
    {
        return $admissionYear . '-' . ($admissionYear + (int) ceil($trainingDuration));
    }

    private function fillStudentCohort(array &$payload): void
    {
        if (($payload['role'] ?? 'student') !== 'student' && ! isset($payload['nam_nhap_hoc'])) {
            return;
        }

        if (isset($payload['nam_nhap_hoc'])) {
            $trainingDuration = $this->getTrainingDuration($payload['nganh_dao_tao_id'] ?? null);
            $payload['khoa_hoc'] = $this->academicCohort((int) $payload['nam_nhap_hoc'], $trainingDuration);
        }
    }

    private function getTrainingDuration(mixed $nganhDaoTaoId): float
    {
        if (! $nganhDaoTaoId) {
            return 4.0;
        }

        $nganhDaoTao = NganhDaoTao::query()
            ->whereKey($nganhDaoTaoId)
            ->first(['ma_nganh', 'thoi_gian_dao_tao']);

        if (! $nganhDaoTao) {
            return 4.0;
        }

        if (preg_match('/(MP|HV)$/u', $nganhDaoTao->ma_nganh)) {
            return 4.5;
        }

        return (float) ($nganhDaoTao->thoi_gian_dao_tao ?? 4.0);
    }

    private function lecturerRules(): array
    {
        return [
            ...$this->baseCreateRules(),
            'username' => ['required', 'string', 'regex:/^\d{7}$/', Rule::unique('users', 'username')],
            'don_vi_id' => ['required', 'integer', 'exists:don_vis,id'],
            'ten_giang_vien' => [
                'required',
                'string',
                'max:255',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (! preg_match('/^[\p{L}\s]+$/u', trim((string) $value))) {
                        $fail('Tên giảng viên chỉ được gồm chữ cái và khoảng trắng.');
                    }
                },
            ],
            'dia_chi' => ['nullable', 'string'],
            'chuc_vu' => ['nullable', 'string', 'max:255'],
            'chuc_danh' => ['nullable', 'string', 'max:255'],
        ];
    }

    private function managerRules(): array
    {
        return [
            ...$this->baseCreateRules(),
            'ten_nguoi_quan_ly' => ['required', 'string', 'max:255'],
            'chuc_vu' => ['nullable', 'string', 'max:255'],
        ];
    }

    private function trainingOfficerRules(): array
    {
        return [
            ...$this->baseCreateRules(),
            'ten_chuyen_vien' => ['required', 'string', 'max:255'],
            'chuc_vu' => ['nullable', 'string', 'max:255'],
        ];
    }

    private function toAccountPayload(User $user): array
    {
        $user->loadMissing(['role', 'profile']);

        return [
            'id' => $user->id,
            'username' => $user->username,
            'role' => $user->role?->code,
            'role_name' => $user->role?->name,
            'status' => (bool) $user->status,
            'display_name' => $user->profileName(),
            'email' => $user->profileEmail(),
            'profile_type' => $user->profile_type,
            'profile_id' => $user->profile_id,
            'profile' => $user->profile,
            'last_login_at' => $user->last_login_at,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
        ];
    }
}
